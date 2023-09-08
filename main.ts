import {
	App,
	ButtonComponent,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface PropertiesPluginSettings {
	showButton: boolean;
}

const DEFAULT_SETTINGS: PropertiesPluginSettings = {
	showButton: true,
};

const ROOT_WORKSPACE_CLASS = ".mod-vertical.mod-root";

export default class PropertiesPlugin extends Plugin {
	settings: PropertiesPluginSettings;
	fileProperties: Map<string, boolean> = new Map();

	private checkActive() {
		const active = this.app.workspace.getActiveViewOfType(MarkdownView);
		return active;
	}
	private setFileProps(value: boolean) {
		const file = this.app.workspace.getActiveFile();
		this.fileProperties.set(file!.name, value);
	}
	private setOpacity(element: HTMLElement, opacity: string) {
		return (element.style.opacity = opacity);
	}
	private setDisplay(element: Element, display: string) {
		return element?.setAttribute("style", display);
	}
	private createPropertiesElement(
		config: {
			id: string;
			className: string;
			icon: string;
		},
		fn: () => void
	) {
		let topWidget = createEl("div");
		topWidget.setAttribute("class", `div-${config.className}`);
		topWidget.setAttribute("id", config.id);
		let button = new ButtonComponent(topWidget);
		button.setClass("buttonItem").onClick(fn);
		button.buttonEl.innerHTML = config.icon;
		document.body
			.querySelector(ROOT_WORKSPACE_CLASS)
			?.insertAdjacentElement("afterbegin", topWidget);

		this.setOpacity(topWidget, "0");
	}

	public createElements() {
		const { showButton } = this.settings;
		//@ts-ignore
		const showProperties = this.app.vault.config.propertiesInDocument;
		if (showButton && showProperties === "visible") {
			this.createPropertiesElement(
				{
					id: "_propertiesButton",
					className: "propertiesButton",
					icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" class="svg-icon">
					<path d="M21 9L17 9" stroke-width="2" stroke-linecap="round"/>
					<path d="M21 15L17 15" stroke-width="2" stroke-linecap="round"/>
					<path d="M14 9H10" stroke-width="2" stroke-linecap="round"/>
					<path d="M14 15H10" stroke-width="2" stroke-linecap="round"/>
					<path d="M7 9H3" stroke-width="2" stroke-linecap="round"/>
					<path d="M7 15H3" stroke-width="2" stroke-linecap="round"/>
					</svg><text>Toggle Properties</text>`,
				},
				this.toggleProperties.bind(this)
			);
		}
	}

	public removeButton(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.remove();
		}
	}

	public unfoldProperties() {
		const active = this.checkActive();
		if (active) {
			const isCollapsed = active.contentEl.querySelectorAll(
				".metadata-container .is-collapsed"
			);
			if (isCollapsed.length) {
				//@ts-ignore
				this.app.commands.executeCommandById(
					"editor:toggle-fold-properties"
				);
			}
		}
	}

	private toggleProperties() {
		const active = this.checkActive();

		if (active) {
			const properties = active.contentEl.querySelector(
				".metadata-container"
			);
			if (properties?.getAttribute("data-property-count") === "0") {
				if (getComputedStyle(properties!)?.display === "block") {
					this.setDisplay(properties, "display: none");
					this.setFileProps(false);
				} else {
					this.setDisplay(properties!, "display: block");
					this.setFileProps(true);
					//@ts-ignore
					this.app.commands.executeCommandById(
						"markdown:add-metadata-property"
					);
					const input = active.contentEl.querySelector(
						".metadata-property-key-input"
					);
					input?.addEventListener("focusout", () => {
						if (
							properties?.getAttribute("data-property-count") ===
							"0"
						) {
							this.setDisplay(properties, "display: none");
							this.setFileProps(false);
						}
					});
				}
			} else {
				if (getComputedStyle(properties!)?.display === "block") {
					this.setDisplay(properties!, "display: none");
					this.setFileProps(false);
				} else {
					this.setDisplay(properties!, "display: block");
					this.setFileProps(true);
					this.unfoldProperties();
				}
			}
		}
	}

	private showElement() {
		const active = this.checkActive();
		const file = this.app.workspace.getActiveFile()?.name;
		//@ts-ignore
		const propertiesShown = this.app.vault.config.propertiesInDocument;
		if (file && !this.fileProperties.has(file)) {
			this.fileProperties.set(file, false);
		}

		if (file) {
			const properties = active!.contentEl.querySelector(
				".metadata-container"
			);
			const collapsed = active!.contentEl.querySelector(
				".metadata-container .is-collapsed"
			);
			if (
				this.fileProperties.get(file) &&
				propertiesShown === "visible"
			) {
				this.setDisplay(properties!, "display: block");
				if (!collapsed) {
					//@ts-ignore
					this.app.commands.executeCommandById(
						"editor:toggle-fold-properties"
					);
				}
			} else {
				this.setDisplay(properties!, "display: none");
			}
		}
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PropertiesSettingsTab(this.app, this));
		this.app.workspace.onLayoutReady(() => {
			this.createElements();
		});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				let active = this.checkActive();
				if (active) {
					active.contentEl
						.querySelector(".inline-title")
						?.addEventListener("mouseenter", () => {
							const button =
								document.getElementById("_propertiesButton");
							if (button) {
								active!.contentEl
									.querySelector(".cm-sizer")
									?.insertAdjacentElement(
										"afterbegin",
										button
									);
								this.setOpacity(button, "1");
								button.addEventListener("mouseenter", () => {
									this.setOpacity(button, "1");
								});
								button.addEventListener("mouseleave", () => {
									this.setOpacity(button, "0");
								});
							} else {
								this.createElements();
								const button =
									document.getElementById(
										"_propertiesButton"
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
								document.getElementById("_propertiesButton");
							if (button) {
								this.setOpacity(button, "0");
							}
						});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.showElement();
			})
		);

		this.registerEvent(
			//@ts-ignore
			this.app.vault.on("config-changed", () => {
				const leavesWithProperties =
					this.app.workspace.containerEl.querySelectorAll(
						".metadata-container"
					);

				if (
					//@ts-ignore
					this.app.vault.config.propertiesInDocument !== "visible"
				) {
					this.removeButton("_propertiesButton");
					leavesWithProperties.forEach((leaf) => {
						leaf.setAttribute("style", "display: none");
					});
				} else {
					this.createElements();
					this.showElement();
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				const active =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (active) {
					const properties = active.contentEl.querySelector(
						".metadata-container"
					);
					if (
						properties?.getAttribute("data-property-count") === "0"
					) {
						this.setDisplay(properties, "display: none");
					}
				}
			})
		);

		this.addCommand({
			id: "markdown:add-metadata-property",
			name: "Add file property",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: ";" }],
			callback: () => {
				const active =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (active) {
					const properties = active.contentEl.querySelector(
						".metadata-container"
					);

					if (
						getComputedStyle(properties!)?.display === "none" &&
						properties?.getAttribute("data-property-count") !== "0"
					) {
						this.setDisplay(properties!, "display: block");
						//@ts-ignore
						this.app.commands.executeCommandById(
							"markdown:add-metadata-property"
						);
					} else if (
						getComputedStyle(properties!)?.display === "none"
					) {
						this.toggleProperties();
					} else if (
						getComputedStyle(properties!)?.display === "block"
					) {
						//@ts-ignore
						this.app.commands.executeCommandById(
							"markdown:add-metadata-property"
						);
					}
				}
			},
		});
		this.addCommand({
			id: "toggle-file-properties",
			name: "Toggle File Properties",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "b" }],
			callback: () => {
				this.toggleProperties();
			},
		});
	}

	onunload() {
		this.removeButton("_propertiesButton");
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

class PropertiesSettingsTab extends PluginSettingTab {
	plugin: PropertiesPlugin;

	constructor(app: App, plugin: PropertiesPlugin) {
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
		containerEl.createEl("h2", {
			text: "Toggle Properties Button Settings",
		});

		new Setting(containerEl)
			.setName("Show Toggle Properties Button")
			.setDesc("Show toggle properties button above note title")
			.addToggle((value) =>
				value
					.setValue(this.plugin.settings.showButton)
					.onChange(async (value) => {
						this.plugin.settings.showButton = value;
						await this.plugin.saveSettings();
						this.rebuildElements("_propertiesButton");
					})
			);
	}
}

// (t.prototype.collapseProperties = function (e) {
// 	this.metadataEditor.setCollapse(e, !1);
// }),
// 	(t.prototype.toggleCollapseProperties = function () {
// 		var e;
// 		"hidden" !== this.app.vault.getConfig("propertiesInDocument") &&
// 		this.metadataEditor.containerEl.isShown()
// 			? this.metadataEditor.toggleCollapse()
// 			: null === (e = this.editMode) ||
// 			  void 0 === e ||
// 			  e.toggleFoldFrontmatter();
// 	});
