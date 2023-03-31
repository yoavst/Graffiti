using Visio = Microsoft.Office.Interop.Visio;
using Microsoft.Office.Tools.Ribbon;
using System.Drawing;

namespace GraffitiForVisio
{
    public partial class GraffitiRibbon
    {
        public Image GetImageForTheme(int index)
        {
            Image image = new Bitmap(25, 25);
            using (Graphics graphics = Graphics.FromImage(image))
            {
                using (SolidBrush BackgroundBrush = new SolidBrush(Themes.Default[index].BackgroundColor))
                {
                    using (SolidBrush TextBrush = new SolidBrush(Themes.Default[index].TextColor))
                    {
                        graphics.DrawRectangle(Pens.Gray, 0, 0, 24, 24);
                        graphics.FillRectangle(BackgroundBrush, 1, 1, 23, 23);
                        graphics.DrawString("A", new Font("Calibri", 6, FontStyle.Bold), TextBrush, 7, 6);
                    }
                }
            }
            return image;
        }

        private void OnLoad(object sender, RibbonUIEventArgs e)
        {
            var buttons = new RibbonButton[]{FirstThemeColor, SecondThemeColor, ThirdThemeColor, ForthThemeColor, FifthThemeColor};
            for (var i = 0; i < buttons.Length; i++)
            {
                var copyI = i;
                var btn = buttons[i];
                btn.Image = GetImageForTheme(i);
                btn.Click += (sender2, e2) =>
                {
                    foreach (Visio.Shape shape in Globals.GraffitiAddIn.Application.ActiveWindow.Selection)
                    {
                        Globals.GraffitiAddIn.UpdateTheme(shape, Themes.Default[copyI]);

                    }
                };
            }

            AutoRelayoutSetting.Checked = Globals.GraffitiAddIn.ShouldAutoLayout;
        }

        public void SetConnected()
        {
            ConnectButton.Label = "Connect (✅)";
        }

        public void SetDisconnected()
        {
            ConnectButton.Label = "Connect";
        }

        public void SetErrorConnection()
        {
            ConnectButton.Label = "Connect (❌)";
        }

        private void OnConnectClicked(object sender, RibbonControlEventArgs e)
        {
            SetDisconnected();
            var host = HostEditBox.Text;
            var port = int.Parse(PortEditBox.Text);

            Globals.GraffitiAddIn.OnConnectClicked(host, port);
        }

        private void GotoInEditor_Click(object sender, RibbonControlEventArgs e)
        {
            Globals.GraffitiAddIn.GotoInEditor(Globals.GraffitiAddIn.Application.ActiveWindow.Selection.PrimaryItem);
        }

        private void AutoRelayoutSetting_Click(object sender, RibbonControlEventArgs e)
        {
            Globals.GraffitiAddIn.ShouldAutoLayout = AutoRelayoutSetting.Checked;
        }

        private void isExistingToNew_Click(object sender, RibbonControlEventArgs e)
        {
            Globals.GraffitiAddIn.isExistingToNew = isExistingToNew.Checked;
        }
    }
}
