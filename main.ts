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
	showUI: boolean;
}

const DEFAULT_SETTINGS: FrontmatterPluginSettings = {
	showButton: true,
	showUI: false,
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
				this.addProperties.bind(this)
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
		const { showUI } = this.settings;
		if (showUI) {
			this.createUIElement({
				id: "_uiElement",
				className: "uiElement",
			});
		}
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

	private addProperties() {
		let active = this.app.workspace.getActiveViewOfType(MarkdownView);
		if(active) {
			let properties = active.contentEl.querySelector(".metadata-container")
			properties?.setAttribute("style", "display: block")
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
			})
		);
	}

	onunload() {
		this.removeButton("_frontmatterButton");
		this.removeButton("_uiElement");
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

class FrontmatterSettingsTab extends PluginSettingTab {
	plugin: FrontmatterPlugin;

	constructor(app: App, plugin: FrontmatterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	rebuildElements(element: string) {
		this.plugin.removeButton(element);
		this.plugin.createElements();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Frontmatter Button Settings" });

		new Setting(containerEl)
			.setName("Show frontmatter button")
			.setDesc("Show frontmatter button above note title")
			.addToggle((value) =>
				value
					.setValue(this.plugin.settings.showButton)
					.onChange(async (value) => {
						this.plugin.settings.showButton = value;
						await this.plugin.saveSettings();
						this.rebuildElements("_frontmatterButton");
					})
			);
	}
}
