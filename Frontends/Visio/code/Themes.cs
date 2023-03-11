using System.Drawing;

namespace GraffitiForVisio
{
    static class Themes
    {
        public static readonly Theme[] Default = new Theme[]
        {
            new Theme(BackgroundColor: Color.FromArgb(169, 209, 142), TextColor: Color.Black),
            new Theme(BackgroundColor: Color.FromArgb(189, 208, 233), TextColor: Color.Black),
            new Theme(BackgroundColor: Color.FromArgb(255, 230, 153), TextColor: Color.Black),
            new Theme(BackgroundColor: Color.FromArgb(237, 125, 49), TextColor: Color.Black),
            new Theme(BackgroundColor: Color.FromArgb(217, 217, 217), TextColor: Color.Black)
        };
    }

    class Theme
    {
        public readonly Color BackgroundColor;
        public readonly Color TextColor;

        public Theme(Color BackgroundColor, Color TextColor)
        {
            this.BackgroundColor = BackgroundColor;
            this.TextColor = TextColor;
        }

    }
}
