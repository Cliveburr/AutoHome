using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Main.HomeProject
{
    public class HomeImageDescriptionBuilder
    {
        private readonly string _imageMaskPath;
        private readonly string _settingsPath;
        private readonly string _descriptionPath;

        private class Area
        {
            public Color Color { get; set; }
            public Rectangle Rectangle { get; set; }
            public Point? TopLeft { get; set; }
            public Point? TopRight { get; set; }
            public Point? BottomLeft { get; set; }
            public Point? BottomRight { get; set; }
        }

        public HomeImageDescriptionBuilder(string imageMaskPath, string settingsPath, string descriptionPath)
        {
            _imageMaskPath = imageMaskPath;
            _settingsPath = settingsPath;
            _descriptionPath = descriptionPath;
        }

        public void Build()
        {
            var imageMask = new Bitmap(_imageMaskPath);

            var areas = DetectColors(imageMask);

            var settingsContent = File.ReadAllText(_settingsPath);
            var settings = JsonConvert.DeserializeObject<HomeImageDescriptionSettings>(settingsContent);

            var description = new HomeImageDescription();
            description.globalMargin = settings.GlobalMargin;
            description.childs = new List<HomeImageDescriptionArea>();

            GetAreasFor(areas, 0, 0, settings.Childs, description.childs);
            
            var toDescriptionContent = JsonConvert.SerializeObject(description, Formatting.Indented);
            File.WriteAllText(_descriptionPath, toDescriptionContent);
        }

        private void GetAreasFor(List<Area> areas, int x, int y, List<HomeImageDescriptionSettingsArea> settings, List<HomeImageDescriptionArea> descriptions)
        {
            foreach (var set in settings)
            {
                var hasArea = areas
                    .Where(a => a.Color.R == set.Red && a.Color.B == set.Blue && a.Color.G == set.Green)
                    .FirstOrDefault();
                if (hasArea != null)
                {
                    var newDescr = new HomeImageDescriptionArea
                    {
                        UID = set.UID,
                        image = set.Image,
                        x = hasArea.Rectangle.X - x,
                        y = hasArea.Rectangle.Y - y,
                        width = hasArea.Rectangle.Width,
                        height = hasArea.Rectangle.Height,
                        childs = new List<HomeImageDescriptionArea>()
                    };
                    descriptions.Add(newDescr);
                    if (set.Childs != null)
                    {
                        GetAreasFor(areas, newDescr.x, newDescr.y, set.Childs, newDescr.childs);
                    }
                }
            }
        }

        private List<Area> DetectColors(Bitmap bitmap)
        {
            var areas = new List<Area>();

            for (var x = 0; x < bitmap.Width; x++)
            {
                for (var y = 0; y < bitmap.Height; y++)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    var hasArea = areas
                        .FirstOrDefault(a => a.Color == pointColor);
                    if (hasArea == null)
                    {
                        areas.Add(new Area
                        {
                            Color = pointColor,
                            TopLeft = new Point(x, y)
                        });
                    }
                }
            }

            for (var x = bitmap.Width - 1; x > 0; x--)
            {
                for (var y = 0; y < bitmap.Height; y++)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    var area = areas
                        .FirstOrDefault(a => a.Color == pointColor && a.TopRight == null);
                    if (area != null)
                    {
                        area.TopRight = new Point(x, y);
                    }
                }
            }

            for (var x = 0; x < bitmap.Width; x++)
            {
                for (var y = bitmap.Height - 1; y > 0; y--)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    var area = areas
                        .FirstOrDefault(a => a.Color == pointColor && a.BottomLeft == null);
                    if (area != null)
                    {
                        area.BottomLeft = new Point(x, y);
                    }
                }
            }

            for (var x = bitmap.Width - 1; x > 0; x--)
            {
                for (var y = bitmap.Height - 1; y > 0; y--)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    var area = areas
                        .FirstOrDefault(a => a.Color == pointColor && a.BottomRight == null);
                    if (area != null)
                    {
                        area.BottomRight = new Point(x, y);
                    }
                }
            }

            foreach (var area in areas)
            {
                var mostTopLeft = new Point(Math.Min(area.TopLeft.Value.X, area.BottomLeft.Value.X), Math.Min(area.TopLeft.Value.Y, area.TopRight.Value.Y));
                var mostBottomRight = new Point(Math.Max(area.BottomRight.Value.X, area.TopRight.Value.X), Math.Max(area.BottomRight.Value.Y, area.BottomLeft.Value.Y));

                var size = new Size(mostBottomRight.X - mostTopLeft.X, mostBottomRight.Y - mostTopLeft.Y);

                area.Rectangle = new Rectangle(mostTopLeft, size);
            }

            return areas;
        }
    }
}
