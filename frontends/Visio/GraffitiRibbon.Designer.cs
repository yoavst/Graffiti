namespace GraffitiForVisio
{
    partial class GraffitiRibbon : Microsoft.Office.Tools.Ribbon.RibbonBase
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        public GraffitiRibbon()
            : base(Globals.Factory.GetRibbonFactory())
        {
            InitializeComponent();
        }

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.tab1 = this.Factory.CreateRibbonTab();
            this.group1 = this.Factory.CreateRibbonGroup();
            this.HostEditBox = this.Factory.CreateRibbonEditBox();
            this.PortEditBox = this.Factory.CreateRibbonEditBox();
            this.ColorsGroup = this.Factory.CreateRibbonGroup();
            this.group2 = this.Factory.CreateRibbonGroup();
            this.AutoRelayoutSetting = this.Factory.CreateRibbonCheckBox();
            this.ConnectButton = this.Factory.CreateRibbonButton();
            this.GotoInEditor = this.Factory.CreateRibbonButton();
            this.FirstThemeColor = this.Factory.CreateRibbonButton();
            this.SecondThemeColor = this.Factory.CreateRibbonButton();
            this.ThirdThemeColor = this.Factory.CreateRibbonButton();
            this.ForthThemeColor = this.Factory.CreateRibbonButton();
            this.FifthThemeColor = this.Factory.CreateRibbonButton();
            this.isExistingToNew = this.Factory.CreateRibbonToggleButton();
            this.tab1.SuspendLayout();
            this.group1.SuspendLayout();
            this.ColorsGroup.SuspendLayout();
            this.group2.SuspendLayout();
            this.SuspendLayout();
            // 
            // tab1
            // 
            this.tab1.ControlId.ControlIdType = Microsoft.Office.Tools.Ribbon.RibbonControlIdType.Office;
            this.tab1.Groups.Add(this.group1);
            this.tab1.Groups.Add(this.ColorsGroup);
            this.tab1.Groups.Add(this.group2);
            this.tab1.Label = "Graffiti";
            this.tab1.Name = "tab1";
            // 
            // group1
            // 
            this.group1.Items.Add(this.HostEditBox);
            this.group1.Items.Add(this.PortEditBox);
            this.group1.Items.Add(this.ConnectButton);
            this.group1.Items.Add(this.GotoInEditor);
            this.group1.Label = "Connection";
            this.group1.Name = "group1";
            // 
            // HostEditBox
            // 
            this.HostEditBox.Label = "Host";
            this.HostEditBox.Name = "HostEditBox";
            this.HostEditBox.Text = "localhost";
            // 
            // PortEditBox
            // 
            this.PortEditBox.Label = "Port";
            this.PortEditBox.Name = "PortEditBox";
            this.PortEditBox.Text = "8503";
            // 
            // ColorsGroup
            // 
            this.ColorsGroup.Items.Add(this.FirstThemeColor);
            this.ColorsGroup.Items.Add(this.SecondThemeColor);
            this.ColorsGroup.Items.Add(this.ThirdThemeColor);
            this.ColorsGroup.Items.Add(this.ForthThemeColor);
            this.ColorsGroup.Items.Add(this.FifthThemeColor);
            this.ColorsGroup.Label = "Theme";
            this.ColorsGroup.Name = "ColorsGroup";
            // 
            // group2
            // 
            this.group2.Items.Add(this.AutoRelayoutSetting);
            this.group2.Items.Add(this.isExistingToNew);
            this.group2.Label = "Settings";
            this.group2.Name = "group2";
            // 
            // AutoRelayoutSetting
            // 
            this.AutoRelayoutSetting.Label = "Auto re-layout after addition";
            this.AutoRelayoutSetting.Name = "AutoRelayoutSetting";
            this.AutoRelayoutSetting.Click += new Microsoft.Office.Tools.Ribbon.RibbonControlEventHandler(this.AutoRelayoutSetting_Click);
            // 
            // ConnectButton
            // 
            this.ConnectButton.Label = "Connect";
            this.ConnectButton.Name = "ConnectButton";
            this.ConnectButton.OfficeImageId = "DataAutomaticallyLink";
            this.ConnectButton.ShowImage = true;
            this.ConnectButton.Click += new Microsoft.Office.Tools.Ribbon.RibbonControlEventHandler(this.OnConnectClicked);
            // 
            // GotoInEditor
            // 
            this.GotoInEditor.ControlSize = Microsoft.Office.Core.RibbonControlSize.RibbonControlSizeLarge;
            this.GotoInEditor.Label = "Goto in editor";
            this.GotoInEditor.Name = "GotoInEditor";
            this.GotoInEditor.OfficeImageId = "FileCheckOut";
            this.GotoInEditor.ShowImage = true;
            this.GotoInEditor.Click += new Microsoft.Office.Tools.Ribbon.RibbonControlEventHandler(this.GotoInEditor_Click);
            // 
            // FirstThemeColor
            // 
            this.FirstThemeColor.ControlSize = Microsoft.Office.Core.RibbonControlSize.RibbonControlSizeLarge;
            this.FirstThemeColor.Label = "1";
            this.FirstThemeColor.Name = "FirstThemeColor";
            this.FirstThemeColor.ShowImage = true;
            // 
            // SecondThemeColor
            // 
            this.SecondThemeColor.ControlSize = Microsoft.Office.Core.RibbonControlSize.RibbonControlSizeLarge;
            this.SecondThemeColor.Label = "2";
            this.SecondThemeColor.Name = "SecondThemeColor";
            this.SecondThemeColor.ShowImage = true;
            // 
            // ThirdThemeColor
            // 
            this.ThirdThemeColor.ControlSize = Microsoft.Office.Core.RibbonControlSize.RibbonControlSizeLarge;
            this.ThirdThemeColor.Label = "3";
            this.ThirdThemeColor.Name = "ThirdThemeColor";
            this.ThirdThemeColor.ShowImage = true;
            // 
            // ForthThemeColor
            // 
            this.ForthThemeColor.ControlSize = Microsoft.Office.Core.RibbonControlSize.RibbonControlSizeLarge;
            this.ForthThemeColor.Label = "4";
            this.ForthThemeColor.Name = "ForthThemeColor";
            this.ForthThemeColor.ShowImage = true;
            // 
            // FifthThemeColor
            // 
            this.FifthThemeColor.ControlSize = Microsoft.Office.Core.RibbonControlSize.RibbonControlSizeLarge;
            this.FifthThemeColor.Label = "5";
            this.FifthThemeColor.Name = "FifthThemeColor";
            this.FifthThemeColor.ShowImage = true;
            // 
            // isExistingToNew
            // 
            this.isExistingToNew.Checked = true;
            this.isExistingToNew.Label = "Is existing to new?";
            this.isExistingToNew.Name = "isExistingToNew";
            this.isExistingToNew.Click += new Microsoft.Office.Tools.Ribbon.RibbonControlEventHandler(this.isExistingToNew_Click);
            // 
            // GraffitiRibbon
            // 
            this.Name = "GraffitiRibbon";
            this.RibbonType = "Microsoft.Visio.Drawing";
            this.Tabs.Add(this.tab1);
            this.Load += new Microsoft.Office.Tools.Ribbon.RibbonUIEventHandler(this.OnLoad);
            this.tab1.ResumeLayout(false);
            this.tab1.PerformLayout();
            this.group1.ResumeLayout(false);
            this.group1.PerformLayout();
            this.ColorsGroup.ResumeLayout(false);
            this.ColorsGroup.PerformLayout();
            this.group2.ResumeLayout(false);
            this.group2.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        internal Microsoft.Office.Tools.Ribbon.RibbonTab tab1;
        internal Microsoft.Office.Tools.Ribbon.RibbonGroup group1;
        internal Microsoft.Office.Tools.Ribbon.RibbonEditBox HostEditBox;
        internal Microsoft.Office.Tools.Ribbon.RibbonEditBox PortEditBox;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton ConnectButton;
        internal Microsoft.Office.Tools.Ribbon.RibbonGroup ColorsGroup;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton FirstThemeColor;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton SecondThemeColor;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton ThirdThemeColor;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton ForthThemeColor;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton FifthThemeColor;
        internal Microsoft.Office.Tools.Ribbon.RibbonButton GotoInEditor;
        internal Microsoft.Office.Tools.Ribbon.RibbonGroup group2;
        internal Microsoft.Office.Tools.Ribbon.RibbonCheckBox AutoRelayoutSetting;
        internal Microsoft.Office.Tools.Ribbon.RibbonToggleButton isExistingToNew;
    }

    partial class ThisRibbonCollection
    {
        internal GraffitiRibbon Ribbon1
        {
            get { return this.GetRibbon<GraffitiRibbon>(); }
        }
    }
}
