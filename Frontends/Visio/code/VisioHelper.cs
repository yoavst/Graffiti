using System;
using System.Collections.Generic;
using System.Linq;
using System.Drawing;
using Visio = Microsoft.Office.Interop.Visio;

namespace GraffitiForVisio
{
    internal class VisioHelper
    {
        private Visio.Document Stencil;
        private Visio.Master ShapeMaster;

        public VisioHelper(Visio.Application application)
        {
            Visio.Documents visioDocs = application.Documents;
            Stencil = visioDocs.OpenEx("USTRME_M.VSSX", (short)Visio.VisOpenSaveArgs.visOpenDocked);
            ShapeMaster = Stencil.Masters.get_ItemU(@"Package (collapsed)");
        }

        public Visio.Shape CreateBasicShape(Visio.Page page, double? xHint = null, double? yHint = null)
        {
            Visio.Shape shape;

            double x = xHint ?? 5;
            double y = yHint ?? 5;

            shape = page.Drop(ShapeMaster, x, y);

            // Set shape border
            shape.CellsU["LineWeight"].FormulaU = "1.5 pt";
            shape.CellsU["LineColor"].FormulaU = "RGB(0, 0, 0)";
            shape.CellsU["LinePattern"].FormulaU = "1";

            // Set shape background color
            SetBackgroundColor(shape, Themes.Default[0].BackgroundColor);

            // Set shape font and text size 
            SetTextColor(shape, Themes.Default[0].TextColor);
            shape.CellsU["Char.Font"].FormulaU = "\"Calibri\"";
            shape.CellsU["Char.Size"].FormulaU = "6 pt";

            // Set bold
            var chars = shape.Characters;
            chars.Begin = 0;
            chars.End = chars.CharCount;
            chars.set_CharProps((short)Visio.VisCellIndices.visCharacterStyle, (short)Visio.VisCellVals.visBold);

            // resize shape to match text
            shape.CellsU["Width"].FormulaU = "=TEXTWIDTH(TheText)";
            shape.CellsU["Height"].FormulaU = "=TEXTHEIGHT(TheText,(Width))";
            return shape;
        }

        public void SetBackgroundColor(Visio.Shape shape, Color color)
        {
            shape.CellsU["FillForegnd"].FormulaU = string.Format("RGB({0},{1},{2})", color.R, color.G, color.B);
        }

        public void SetTextColor(Visio.Shape shape, Color color)
        {
            shape.CellsU["Char.Color"].FormulaU = string.Format("RGB({0},{1},{2})", color.R, color.G, color.B);
        }

        public void Connect(Visio.Page page, Visio.Shape shape1, Visio.Shape shape2, bool isTheSelectedNodeTarget, string label = null)
        {
            if (shape1 == shape2)
            {
                // TODO
                return;

            }

            if (isTheSelectedNodeTarget)
            {
                var temp = shape1;
                shape1 = shape2;
                shape2 = temp;
            }
            if (shape1 != null && shape2 != null)
            {
                Visio.Shape connector = page.Drop(page.Application.ConnectorToolDataObject, 0.0, 0.0);

                // Set connector font, in case we want to add a label
                connector.CellsU["Char.Font"].FormulaU = "\"Calibri\"";
                connector.CellsU["Char.Size"].FormulaU = "6 pt";

                if (label != null)
                {
                    connector.Characters.Text = label;
                }

                // Set the connector's endpoints
                connector.CellsU["BeginX"].GlueTo(shape1.CellsU["PinX"]);
                connector.CellsU["EndX"].GlueTo(shape2.CellsU["PinX"]);

                //shape1.AutoConnect(shape2, Visio.VisAutoConnectDir.visAutoConnectDirDown);
            }
        }

        public void Relayout(Visio.Page page)
        {
            //TODO 

            //var layoutCell = page.PageSheet.get_CellsSRC((short)VisSectionIndices.visSectionObject,(short)VisRowIndices.visRowPageLayout,(short)VisCellIndices.visPLOPlaceStyle);
            //layoutCell.set_Result(VisUnitCodes.visPageUnits, (short)VisCellVals.visPLOPlaceTopToBottom);

            //layoutCell = page.PageSheet.get_CellsSRC((short)VisSectionIndices.visSectionObject,(short)VisRowIndices.visRowPageLayout,(short)VisCellIndices.visPLORouteStyle);
            //layoutCell.set_Result(VisUnitCodes.visPageUnits, (short)VisCellVals.visLORouteFlowchartNS);

            page.Layout();
        }

        public void Select(Visio.Window window, Visio.Shape shape)
        {
            window.Select(shape, (short)Visio.VisSelectArgs.visSelect | (short)Visio.VisSelectArgs.visDeselectAll);
        }

        public Visio.Shape GetMatchingShape(Visio.Page page, Func<Visio.Shape, bool> condition)
        {
            return GetMatchingShapes(page, condition).FirstOrDefault();
        }

        public IEnumerable<Visio.Shape> GetMatchingShapes(Visio.Page page, Func<Visio.Shape, bool> condition)
        {
            return page.Shapes.Cast<Visio.Shape>().Where(condition);
        }

        public Tuple<double?, double?> getXYNearSelection(Visio.Shape selection, bool isTheSelectedNodeTarget)
        {
            if (selection != null)
            {
                var x = selection.Cells["PinX"].Result[Visio.VisUnitCodes.visNoCast];
                var y = selection.Cells["PinY"].Result[Visio.VisUnitCodes.visNoCast] - (isTheSelectedNodeTarget ? -1 : 1);
                return new Tuple<double?, double?>(x, y);
            }
            return new Tuple<double?, double?>(null, null);
        }
    }
}
