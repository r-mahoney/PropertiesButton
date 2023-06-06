import {
	App,
	ButtonComponent,
	MarkdownView,
	Notice,
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

		// curWindow.document.addEventListener("click", function (event) {
		// 	const activeLeaf = app.workspace.getActiveViewOfType(MarkdownView);

		// 	if (activeLeaf) {
		// 		topWidget.style.visibility = "visible";
		// 	} else {
		topWidget.style.visibility = "hidden";
		// 	}
		// });
	}

	public createButton(window?: Window) {
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
			this.createButton();
		});

		this.app.workspace.on("window-open", (win, window) => {
			this.windowSet.add(window);
			this.createButton(window);
		});
		this.app.workspace.on("window-close", (win, window) => {
			this.windowSet.delete(window);
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				document.body
					.querySelectorAll(
						"body > div.app-container > div.horizontal-main-container > div > div.workspace-split.mod-vertical.mod-root > div.workspace-tabs.mod-top.mod-top-right-space.mod-active > div.workspace-tab-container > div"
					)
					.forEach((tab) => {
						tab.querySelector(".inline-title")?.addEventListener(
							"mouseenter",
							() => {
								const button =
									document.getElementById(
										"_frontmatterButton"
									);
								if (button) {
									tab.querySelector(
										".cm-sizer"
									)?.insertAdjacentElement(
										"afterbegin",
										button
									);
									button.style.visibility = "visible";
									button.addEventListener(
										"mouseenter",
										() => {
											button.style.visibility = "visible";
										}
									);
									button.addEventListener(
										"mouseleave",
										() => {
											button.style.visibility = "hidden";
										}
									);
								} else {
									this.createButton();
									const button =
										document.getElementById(
											"_frontmatterButton"
										);
									if (button) {
										tab.querySelector(
											".cm-sizer"
										)?.insertAdjacentElement(
											"afterbegin",
											button
										);
									}
								}
							}
						);
						tab.querySelector(".inline-title")?.addEventListener(
							"mouseleave",
							() => {
								const button =
									document.getElementById(
										"_frontmatterButton"
									);
								if (button) {
									button.style.visibility = "hidden";
								}
							}
						);
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

	rebuildButton() {
		this.plugin.removeButton("_frontmatterButton");
		this.plugin.createButton();
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
						this.rebuildButton();
					})
			);
	}
}
