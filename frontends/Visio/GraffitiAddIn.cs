using System;
using System.Threading.Tasks;
using Visio = Microsoft.Office.Interop.Visio;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Windows.Forms;
using System.Collections.Generic;

namespace GraffitiForVisio
{
    public partial class GraffitiAddIn : NetworkCallback
    {
        internal NetworkController NetworkController;
        private VisioHelper _visioHelper;
        public bool isExistingToNew = true;
        internal VisioHelper VisioHelper { 
            get { 
                if (_visioHelper == null)
                {
                    _visioHelper = new VisioHelper(this.Application);
                }

                return _visioHelper; 
            } 
        }
        internal bool ShouldAutoLayout = true;

        
        void NetworkCallback.OnAddData(AddDataNetworkPush push)
        {
            var currentPage = Application.ActivePage;
            var currentSelection = Application.ActiveWindow.Selection.PrimaryItem;
            var resolvedNode = push.Node.Resolve();

            var currentShape = VisioHelper.GetMatchingShape(currentPage, (shape) => resolvedNode.Address == ShapeToNode(shape)?.Address);

            if (currentShape == null)
            {
                var xy = VisioHelper.getXYNearSelection(currentSelection, !isExistingToNew);

                var newShape = VisioHelper.CreateBasicShape(currentPage, xy.Item1, xy.Item2);
                ApplyNodeToShape(push.Node, newShape);

                currentShape = newShape;
            }

            VisioHelper.Connect(currentPage, currentSelection, currentShape, !isExistingToNew, push.EdgeInfo?.Label);
            

            VisioHelper.Select(Application.ActiveWindow, currentShape);

            if (ShouldAutoLayout)
                VisioHelper.Relayout(currentPage);
        }

        void NetworkCallback.OnAddDataBulk(AddDataBulkNetworkPush addDataBulk)
        {
            var currentPage = Application.ActivePage;
            var currentSelection = Application.ActiveWindow.Selection.PrimaryItem;
            if (currentSelection == null) return;
            var xy = VisioHelper.getXYNearSelection(currentSelection, isTheSelectedNodeTarget: true);

            foreach (var node in addDataBulk.Nodes)
            {
                var resolvedNode = node.Resolve();
                var currentShape = VisioHelper.GetMatchingShape(currentPage, (shape) => resolvedNode.Address == ShapeToNode(shape)?.Address);

                if (currentShape == null)
                {
                    var newShape = VisioHelper.CreateBasicShape(currentPage, xy.Item1, xy.Item2);
                    xy = new Tuple<double?, double?>(xy.Item1 + 1, xy.Item2);

                    ApplyNodeToShape(node, newShape);
                    currentShape = newShape;

                    VisioHelper.Select(Application.ActiveWindow, currentSelection);
                }

                VisioHelper.Connect(currentPage, currentSelection, currentShape, isTheSelectedNodeTarget: true);
            }

            if (ShouldAutoLayout)
                VisioHelper.Relayout(currentPage);
        }


        void NetworkCallback.OnUpdateNodes(UpdateNodesPush push)
        {
            foreach (Visio.Page page in Application.ActiveDocument.Pages)
            {
                var matchingShapes = VisioHelper.GetMatchingShapes(page, (shape) => ShapeToNode(shape)?.Match(push.Selection) ?? false);
                foreach (Visio.Shape shape in matchingShapes)
                {
                    var node = ShapeToNode(shape);
                    var dict = JObject.FromObject(node);
                    foreach (var item in push.Update)
                    {
                        dict[item.Key] = item.Value;
                    }
                    var newNode = dict.ToObject<Node>();
                    ApplyNodeToShape(newNode, shape, applyTheme: false);
                }
            }
        }

        public void OnConnectClicked(string host, int port)
        {
            var oldNetworkController = NetworkController;
            NetworkController = new NetworkController(host, port);
            Task.Run(async () => {
                if (oldNetworkController != null)
                {
                    await oldNetworkController.Close();
                }
                await NetworkController.ConnectAndLoopAsync(this);
            });
        }

        internal void UpdateTheme(Visio.Shape shape, Theme theme)
        {
            ApplyThemeToShape(shape, theme);
            var node = ShapeToNode(shape);
            if (node == null) return;

            node.Properties["theme"] = Array.IndexOf(Themes.Default, theme) + 1;
        }

        internal void GotoInEditor(Visio.Shape shape)
        {
            if (shape == null) return;
            
            var node = ShapeToNode(shape);
            if (node == null) return;

            if (!NetworkController?.IsConnected ?? false) return;

            Task.Run(async () =>
            {

                await NetworkController.SendAsync(JsonConvert.SerializeObject(new Dictionary<string, object>(){
                        {"version", 2},
                        {"project", node.Project},
                        {"address", node.Address}
                    }));
            });
            
        }

        private static Node ShapeToNode(Visio.Shape shape)
        {
            if (shape == null) return null;
            if (shape.Data1 == null) return null;

            return JsonConvert.DeserializeObject<Node>(shape.Data1);
        }

        private void ApplyNodeToShape(Node node, Visio.Shape shape, bool applyTheme = true)
        {
            var resolved = node.Resolve();
            shape.Text = resolved.Label;
            shape.Data1 = JsonConvert.SerializeObject(node);
            if (applyTheme)
                ApplyThemeToShape(shape, resolved.Theme);

        }

        internal void ApplyThemeToShape(Visio.Shape shape, Theme theme)
        {
            VisioHelper.SetTextColor(shape, theme.TextColor);
            VisioHelper.SetBackgroundColor(shape, theme.BackgroundColor);
        }

        #region VSTO generated code

        private void ThisAddIn_Startup(object sender, System.EventArgs e)
        {
            Application.KeyDown += Application_KeyDown;
        }

        private void Application_KeyDown(int KeyCode, int KeyButtonState, ref bool CancelDefault)
        {
            if (KeyCode == (short)0x24)
            {
                var selected = Globals.GraffitiAddIn.Application.ActiveWindow.Selection.PrimaryItem;
                if (selected != null)
                {
                    GotoInEditor(selected);
                    CancelDefault = true;
                }
            }
        }

        private void ThisAddIn_Shutdown(object sender, System.EventArgs e)
        {
        }

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InternalStartup()
        {
            this.Startup += new System.EventHandler(ThisAddIn_Startup);
            this.Shutdown += new System.EventHandler(ThisAddIn_Shutdown);
        }

        #endregion
    }
}
