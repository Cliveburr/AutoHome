using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;

namespace AH.Interfaces.Dashboard.Main.HomeProject
{
    public class HomeStruct
    {
        public int Red { get; set; }
        public int Green { get; set; }
        public int Blue { get; set; }
        public List<HomeStruct> Childs { get; set; }
        public Rectangle Rectangle { get; set; }
        public Bitmap Area { get; set; }
    }

    public partial class HomeProject : Page
    {
        public string HomeFilePath { get; set; } = @"C:\Users\Clivedurr\Desktop\moveis planejamento\home_full.PNG";
        public string MaskFilePath { get; set; } = @"C:\Users\Clivedurr\Desktop\moveis planejamento\home_full_mask2.PNG";
        public string FromJsonPath { get; set; } = @"C:\Users\Clivedurr\Desktop\moveis planejamento\home_description.json";
        public string ToJsonPath { get; set; } = @"C:\Users\Clivedurr\Desktop\moveis planejamento\home_description2.json";
        private Bitmap homeFile;

        public HomeProject()
        {
            InitializeComponent();

            //homeFile = new Bitmap(homeFilePath);
            //image.Source = BitmapToImageSource(homeFile);

            //var findBlackArea = DetectColorRectangle(maskFile, Color.FromArgb(34, 177, 76));
            //if (findBlackArea.HasValue)
            //{
            //    var blackArea = CopyArea(maskFile, findBlackArea.Value);

            //    image.Source = BitmapToImageSource(blackArea);
            //}
            DataContext = this;
        }

        private BitmapImage BitmapToImageSource(Bitmap bitmap)
        {
            using (var memoryStream = new MemoryStream())
            {
                bitmap.Save(memoryStream, System.Drawing.Imaging.ImageFormat.Bmp);
                memoryStream.Position = 0;
                var bitmapimage = new BitmapImage();
                bitmapimage.BeginInit();
                bitmapimage.StreamSource = memoryStream;
                bitmapimage.CacheOption = BitmapCacheOption.OnLoad;
                bitmapimage.EndInit();
                return bitmapimage;
            }
        }

        private Rectangle? DetectColorRectangle(Bitmap bitmap, Color color)
        {
            var topLeft = FindFirstPointFromTopLeft(bitmap, color);
            if (topLeft == null)
            {
                return null;
            }

            var topRight = FindFirstPointFromTopRight(bitmap, color);
            if (topRight == null)
            {
                return null;
            }

            var bottomLeft = FindFirstPointFromBottomLeft(bitmap, color);
            if (bottomLeft == null)
            {
                return null;
            }

            var bottomRight = FindFirstPointFromBottomRight(bitmap, color);
            if (bottomRight == null)
            {
                return null;
            }

            var mostTopLeft = new Point(Math.Min(topLeft.Value.X, bottomLeft.Value.X), Math.Min(topLeft.Value.Y, topRight.Value.Y));
            var mostBottomRight = new Point(Math.Max(bottomRight.Value.X, topRight.Value.X), Math.Max(bottomRight.Value.Y, bottomLeft.Value.Y));

            var size = new Size(mostBottomRight.X - mostTopLeft.X, mostBottomRight.Y - mostTopLeft.Y);

            return new Rectangle(mostTopLeft, size);
        }

        private Point? FindFirstPointFromTopLeft(Bitmap bitmap, Color color)
        {
            for (var x = 0; x < bitmap.Width; x++)
            {
                for (var y = 0; y < bitmap.Height; y++)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    if (pointColor == color)
                    {
                        return new Point(x, y);
                    }
                }
            }
            return null;
        }

        private Point? FindFirstPointFromTopRight(Bitmap bitmap, Color color)
        {
            for (var x = bitmap.Width - 1; x > 0; x--)
            {
                for (var y = 0; y < bitmap.Height; y++)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    if (pointColor == color)
                    {
                        return new Point(x, y);
                    }
                }
            }
            return null;
        }

        private Point? FindFirstPointFromBottomLeft(Bitmap bitmap, Color color)
        {
            for (var x = 0; x < bitmap.Width; x++)
            {
                for (var y = bitmap.Height - 1; y > 0; y--)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    if (pointColor == color)
                    {
                        return new Point(x, y);
                    }
                }
            }
            return null;
        }

        private Point? FindFirstPointFromBottomRight(Bitmap bitmap, Color color)
        {
            for (var x = bitmap.Width - 1; x > 0; x--)
            {
                for (var y = bitmap.Height - 1; y > 0; y--)
                {
                    var pointColor = bitmap.GetPixel(x, y);
                    if (pointColor == color)
                    {
                        return new Point(x, y);
                    }
                }
            }
            return null;
        }

        private Bitmap CopyArea(Bitmap bitmap, Rectangle area)
        {
            var newArea = new Bitmap(area.Width, area.Height);
            for (var x = 0; x < area.Width; x++)
            {
                for (var y = 0; y < area.Height; y++)
                {
                    var pointColor = bitmap.GetPixel(x + area.X, y + area.Y);
                    newArea.SetPixel(x, y, pointColor);
                }
            }
            return newArea;
        }

        private bool alreadyZoom = false;

        private void image_MouseDown(object sender, MouseButtonEventArgs e)
        {
            var point = e.GetPosition(image);
            var mousePoint = new Point((int)Math.Floor(point.X * image.Source.Width / image.ActualWidth), (int)Math.Floor(point.Y * image.Source.Height / image.ActualHeight));

            var maskFile = new Bitmap(MaskFilePath);
            var pixelColor = maskFile.GetPixel((int)mousePoint.X, (int)mousePoint.Y);

            if (alreadyZoom)
            {
                Console.WriteLine(pixelColor);
            }
            else
            {
                var clickedArea = DetectColorRectangle(maskFile, pixelColor);
                var focusArea = CopyArea(homeFile, clickedArea.Value);
                image.Source = BitmapToImageSource(focusArea);
                alreadyZoom = true;
            }
        }

        private void Build_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            try
            {
                var descriptionBuilder = new HomeImageDescriptionBuilder(MaskFilePath, FromJsonPath, ToJsonPath);
                descriptionBuilder.Build();
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
