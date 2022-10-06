using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Main.HomeProject
{
    public class HomeImageDescriptionBuilder
    {
        private readonly string _imageMaskPath;
        private readonly string _fromDescriptionPath;
        private readonly string _toDescriptionPath;

        private class Area
        {
            public Color Color { get; set; }
            public Rectangle Rectangle { get; set; }
            public Point? TopLeft { get; set; }
            public Point? TopRight { get; set; }
            public Point? BottomLeft { get; set; }
            public Point? BottomRight { get; set; }
        }

        public HomeImageDescriptionBuilder(string imageMaskPath, string fromDescriptionPath, string toDescriptionPath)
        {
            _imageMaskPath = imageMaskPath;
            _fromDescriptionPath = fromDescriptionPath;
            _toDescriptionPath = toDescriptionPath;
        }

        public void Build()
        {
            var imageMask = new Bitmap(_imageMaskPath);

            var areas = DetectColors(imageMask);

            var fromDescriptionContent = File.ReadAllText(_fromDescriptionPath);
            var fromDescription = JsonConvert.DeserializeObject<HomeImageDescription>(fromDescriptionContent);
            fromDescription.Areas = fromDescription.Areas ?? new List<HomeImageDescriptionArea>();

            foreach (var area in areas)
            {
                var hasDescription = fromDescription.Areas
                    .Where(a => a.Red == area.Color.R && a.Blue == area.Color.B && a.Green == area.Color.G)
                    .FirstOrDefault();
                if (hasDescription == null)
                {
                    fromDescription.Areas.Add(new HomeImageDescriptionArea
                    {
                        Red = area.Color.R,
                        Blue = area.Color.B,
                        Green = area.Color.G,
                        PointX = area.Rectangle.X,
                        PointY = area.Rectangle.Y,
                        Width = area.Rectangle.Width,
                        Height = area.Rectangle.Height
                    });
                }
                else
                {
                    hasDescription.Red = area.Color.R;
                    hasDescription.Blue = area.Color.B;
                    hasDescription.Green = area.Color.G;
                    hasDescription.PointX = area.Rectangle.X;
                    hasDescription.PointY = area.Rectangle.Y;
                    hasDescription.Width = area.Rectangle.Width;
                    hasDescription.Height = area.Rectangle.Height;
                }
            }

            fromDescription.Areas = fromDescription.Areas
                .Where(a => !(a.Red == 255 && a.Blue == 255 & a.Green == 255))
                .ToList();

            var toDescriptionContent = JsonConvert.SerializeObject(fromDescription, Formatting.Indented);
            File.WriteAllText(_toDescriptionPath, toDescriptionContent);
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
