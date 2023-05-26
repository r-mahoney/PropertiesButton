import {
	Plugin,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	addButton() {
		const title = document.querySelector(".inline-title");
		const buttonDiv = document.createElement("div");
		buttonDiv.id = "button-div"
		const button = document.createElement("button");
		button.id = "header-button";
		button.innerHTML = "Add Frontmatter";
		buttonDiv.appendChild(button);
		title?.addEventListener("mouseenter", () => {
			if (!document.getElementById("header-button")) {
				title?.after(buttonDiv);
				buttonDiv?.addEventListener("mouseleave", () => {
					buttonDiv.remove();
				});
			}
		});

		button.addEventListener("click", () => {
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
		});
	}
	cleanUp() {
		const buttonDiv = document.getElementById("button-div")
		buttonDiv?.remove()
	}

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.cleanUp();
				this.addButton();
			})
		);
	}

	onunload() {}

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

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const { containerEl } = this;

// 		containerEl.empty();

// 		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

// 		new Setting(containerEl)
// 			.setName("Setting #1")
// 			.setDesc("It's a secret")
// 			.addText((text) =>
// 				text
// 					.setPlaceholder("Enter your secret")
// 					.setValue(this.plugin.settings.mySetting)
// 					.onChange(async (value) => {
// 						console.log("Secret: " + value);
// 						this.plugin.settings.mySetting = value;
// 						await this.plugin.saveSettings();
// 					})
// 			);
// 	}
// }
