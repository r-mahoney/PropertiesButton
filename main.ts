import {
	App,
	ButtonComponent,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface FrontmatterPluginSettings {
	showButton: boolean;
}

const DEFAULT_SETTINGS: FrontmatterPluginSettings = {
	showButton: true,
};

const ROOT_WORKSPACE_CLASS = ".mod-vertical.mod-root";

export default class FrontmatterPlugin extends Plugin {
	settings: FrontmatterPluginSettings;
	windowSet: Set<Window> = new Set();

	private createFrontmatterElement(
		config: {
			id: string;
			className: string;
			icon: string;
			curWindow?: Window;
		},
		fn: () => void
	) {
		let topWidget = createEl("div");
		topWidget.setAttribute("class", `div-${config.className}`);
		topWidget.setAttribute("id", config.id);

		let button = new ButtonComponent(topWidget);
		button.setClass("buttonItem").onClick(fn);

		button.buttonEl.innerHTML = config.icon;

		let curWindow = config.curWindow || window;

		curWindow.document.body
			.querySelector(ROOT_WORKSPACE_CLASS)
			?.insertAdjacentElement("afterbegin", topWidget);

		topWidget.style.opacity = "0";
	}

	private createUIElement(config: {
		id: string;
		className: string;
		curWindow?: Window;
	}) {
		const handleSubmit = (e: MouseEvent) => {
			let editor = this.app.workspace.activeEditor?.editor;
			let content = editor?.getValue();
			let inputValue = (<HTMLInputElement>(
				document.getElementsByClassName("keyValueInput")[0]
			)).value;
			if(content?.search(/---\s*[\s\S]*?\s*---/) === 0) {
				let newContent = content?.replace(
					/(---)(\s*[\s\S]*?\s*)(---)/, `$1$2${inputValue}\n$1`
				);
				editor?.setValue(newContent);
			}
			let keyValueInput = (<HTMLInputElement>document.getElementById("keyValueInput"));
			keyValueInput.value = "";
			e.preventDefault();
		};

		let active = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (active) {
			const noteFile = this.app.workspace.getActiveFile();
			if (!noteFile) return;

			const ui = active.contentEl.querySelector(".div-uiElement");
			const frontmatter =
				app.metadataCache.getFileCache(noteFile)?.frontmatter;
			if (!ui) {
				let uiElement = createEl("div");
				uiElement.setAttribute("class", `div-${config.className}`);
				uiElement.setAttribute("id", config.id);
				let title = active.contentEl.querySelector(".inline-title");
				uiElement.innerHTML = `<form class="FMForm"><input type='text' class="keyValueInput" id="keyValueInput"
					style={{width: "50%", height: "15px"}}></input><button type="submit">Add Key: Value</button></form><div class="yamlContainer"></div>`;

				if (frontmatter) {
					const yamlContainer =
						uiElement.querySelector(".yamlContainer");
					const entries = Object.entries(frontmatter);
					entries.forEach(([key, value]) => {
						if (key !== "position") {
							yamlContainer!.innerHTML += `<div>${key}: ${value}</div>`;
						}
					});
				}
				const form = uiElement.querySelector(".FMForm");
				form?.addEventListener("submit", handleSubmit);
				title?.insertAdjacentElement("afterend", uiElement);
			}
		}
	}

	public createElements(window?: Window) {
		const { showButton } = this.settings;
		if (showButton) {
			this.createFrontmatterElement(
				{
					id: "_frontmatterButton",
					className: "frontmatterButton",
					icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M21 9L17 9" stroke="black" stroke-width="2" stroke-linecap="round"/>
					<path d="M21 15L17 15" stroke="black" stroke-width="2" stroke-linecap="round"/>
					<path d="M14 9H10" stroke="black" stroke-width="2" stroke-linecap="round"/>
					<path d="M14 15H10" stroke="black" stroke-width="2" stroke-linecap="round"/>
					<path d="M7 9H3" stroke="black" stroke-width="2" stroke-linecap="round"/>
					<path d="M7 15H3" stroke="black" stroke-width="2" stroke-linecap="round"/>
					</svg><text>Add Frontmatter</text>`,
					curWindow: window,
				},
				this.addFrontmatter.bind(this)
			);
		}
	}

	public removeButton(id: string, curWindow?: Window) {
		let curWin = curWindow || window;
		const element = curWin.document.getElementById(id);
		if (element) {
			element.remove();
		}
	}

	private addFrontmatter() {
		let editor = this.app.workspace.activeEditor?.editor;
		let content = editor?.getValue();
		if (content?.search(/---\s*[\s\S]*?\s*---/) === 0) {
		} else {
			let value = content?.replace(
				/^.*/,
				(match) => `---\n---\n${match}`
			);
			editor?.setValue(value!);
		}
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FrontmatterSettingsTab(this.app, this));
		this.app.workspace.onLayoutReady(() => {
			this.createElements();
		});

		this.app.workspace.on("window-open", (win, window) => {
			this.windowSet.add(window);
			this.createElements(window);
		});
		this.app.workspace.on("window-close", (win, window) => {
			this.windowSet.delete(window);
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				let active =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				// document.body
				// 	.querySelectorAll(
				// 		"body > div.app-container > div.horizontal-main-container > div > div.workspace-split.mod-vertical.mod-root > div.workspace-tabs > div.workspace-tab-container > div"
				// 	)
				// 	.forEach((tab) => {
				if (active) {
					active.contentEl
						.querySelector(".inline-title")
						?.addEventListener("mouseenter", () => {
							const button =
								document.getElementById("_frontmatterButton");
							if (button) {
								active!.contentEl
									.querySelector(".cm-sizer")
									?.insertAdjacentElement(
										"afterbegin",
										button
									);
								button.style.opacity = "1";
								button.addEventListener("mouseenter", () => {
									button.style.opacity = "1";
								});
								button.addEventListener("mouseleave", () => {
									button.style.opacity = "0";
								});
							} else {
								this.createElements();
								const button =
									document.getElementById(
										"_frontmatterButton"
									);
								if (button) {
									active!.contentEl
										.querySelector(".cm-sizer")
										?.insertAdjacentElement(
											"afterbegin",
											button
										);
								}
							}
						});
					active.contentEl
						.querySelector(".inline-title")
						?.addEventListener("mouseleave", () => {
							const button =
								document.getElementById("_frontmatterButton");
							if (button) {
								button.style.opacity = "0";
							}
						});
				}
				// });
			})
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.createUIElement({
					id: "_uiElement",
					className: "uiElement",
				});
			})
		);
	}

	onunload() {
		this.removeButton("_frontmatterButton");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class FrontmatterSettingsTab extends PluginSettingTab {
	plugin: FrontmatterPlugin;

	constructor(app: App, plugin: FrontmatterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	rebuildElements() {
		this.plugin.removeButton("_frontmatterButton");
		this.plugin.createElements();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Frontmatter Button Settings" });

		new Setting(containerEl)
			.setName("Show frontmatter button")
			.setDesc("Show frontmatter button above not title")
			.addToggle((value) =>
				value
					.setValue(this.plugin.settings.showButton)
					.onChange(async (value) => {
						this.plugin.settings.showButton = value;
						await this.plugin.saveSettings();
						this.rebuildElements();
					})
			);
	}
}

//for adding UI to page,
//since adding a div to a note adds it to every note,
//were going to want a clean up to delete the ui when you leave a note
//and then probably rebuild the ui on the current note
//rebuilding should grab whats in the current notes frontmatter
//build ui with current notes frontamtter and general UI

//hiding OG frontmatter
//its open by default, so we can grab the lines and anything in bewtween
//and add a display:hidden and then grab indicator and add display: hidden
