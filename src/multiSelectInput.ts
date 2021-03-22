import * as vscode from 'vscode';
import { window, Disposable, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons } from 'vscode';
import { Octokit } from '@octokit/core';

export async function multiStepInput(context: ExtensionContext) {

	interface State {
		title: string;
		step: number;
		totalSteps: number;
        token:string;
        user:string;
        repo:string;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => inputToken(input, state));
		return state as State;
	}

	const title = 'Add GitHub Info';


    async function inputToken(input: MultiStepInput, state: Partial<State>) {
		state.token = await input.showInputBox({
			title,
			step: 1,
			totalSteps:3,
			value: state.token || '',
			prompt: 'Enter your GitHub token',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputUser(input, state);
	}

    async function inputUser(input: MultiStepInput, state: Partial<State>) {
		state.user = await input.showInputBox({
			title,
			step: 2,
			totalSteps: 3,
			value: state.user || '',
			prompt: 'Enter your GitHub username(owner)',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputRepoForIssue(input, state);
	}


    async function inputRepoForIssue(input: MultiStepInput, state: Partial<State>) {
		state.repo = await input.showInputBox({
			title,
			step: 3,
			totalSteps: 3,
			value: state.repo || '',
			prompt: 'Create a empty github repo for your issue blog, give a name for the repo',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
	}



	function shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}

	async function validateNameIsUnique(name: string) {
		// ...validate...
		return !name ? 'Can not be empty' : undefined;
	}
	const state = await collectInputs();
    await vscode.workspace.getConfiguration('blogger').update('github.token',state.token,vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration('blogger').update('github.user',state.user,vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration('blogger').update('github.repo',state.repo,vscode.ConfigurationTarget.Global);
	const octokit = new Octokit({auth:state.token});

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Window,
		cancellable: false,
		title: 'Creating the issue blog...'
	}, async (progress) => {
		progress.report({  increment: 0 });
		try{
			await octokit.request("POST /user/repos",{name:state.repo});
			window.showInformationMessage(`Init GitHub issue blog successfully~`);
		}catch(e){
			window.showErrorMessage('Init GitHub issue blog failed, please check the config~');
		}
		progress.report({ increment: 100 });
	});
}


interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;


class MultiStepInput {

	static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];
	private async stepThrough<T>(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}