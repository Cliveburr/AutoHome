using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace AH.Interfaces.Dashboard.Controls
{
    public partial class TempHumiSensorGraph : UserControl
    {
        private List<TempHumiSensorGraphModel> _data;
        private float _yView;
        private float _yViewAdjust;
        private bool _lockObjects;

        public TempHumiSensorGraph()
        {
            _lockObjects = true;
            InitializeComponent();

            _data = new List<TempHumiSensorGraphModel>();

            _data.AddRange(new TempHumiSensorGraphModel[]
            {
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(0),
                    Temperature = 31,
                    TemperatureSwitch = true,
                    Humidity = 80,
                    HumiditySwitch = true
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(1),
                    Temperature = 28,
                    TemperatureSwitch = true,
                    Humidity = 85,
                    HumiditySwitch = true
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(2),
                    Temperature = 21,
                    TemperatureSwitch = true,
                    Humidity = 90,
                    HumiditySwitch = false
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(3),
                    Temperature = 15,
                    TemperatureSwitch = true,
                    Humidity = 92,
                    HumiditySwitch = false
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(4),
                    Temperature = 10,
                    TemperatureSwitch = false,
                    Humidity = 92,
                    HumiditySwitch = false
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(5),
                    Temperature = 11,
                    TemperatureSwitch = false,
                    Humidity = 90,
                    HumiditySwitch = false
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(6),
                    Temperature = 12,
                    TemperatureSwitch = false,
                    Humidity = 88,
                    HumiditySwitch = false
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(7),
                    Temperature = 14,
                    TemperatureSwitch = true,
                    Humidity = 85,
                    HumiditySwitch = true
                },
                new TempHumiSensorGraphModel
                {
                    DateTime = DateTime.Now.AddMinutes(8),
                    Temperature = 13,
                    TemperatureSwitch = true,
                    Humidity = 88,
                    HumiditySwitch = true
                }
            });
        }

        private void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            RefreshMe();
        }

        public void AddData(List<TempHumiSensorGraphModel> data)
        {
            _data.AddRange(data);

            _data = _data
                .Distinct()
                .OrderBy(d => d.DateTime)
                .ToList();

            RefreshMe();
        }

        public void ClearData()
        {
            _data.Clear();

            RefreshMe();
        }

        private void Slider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (_lockObjects)
            {
                return;
            }

            RefreshMe();
        }

        private void RefreshMe()
        {
            _lockObjects = true;

            CalculateField();

            PrintCanvas();

            _lockObjects = false;
        }

        private void CalculateField()
        {
            var fieldLenghtPxs = slider.Value * _data.Count;

            if (_data.Count > 1)
            {
                //var dataByTemperature = _data
                //    .OrderBy(d => d.Temperature)
                //    .ToList();
                //var minTemperature = dataByTemperature.First();
                //var maxTemperature = dataByTemperature.Last();

                //var dataByHumidity = _data
                //    .OrderBy(d => d.Humidity)
                //    .ToList();
                //var minHumidity = dataByHumidity.First();
                //var maxHumidity = dataByHumidity.Last();

                //_yViewAdjust = Math.Min(minTemperature.Temperature, minHumidity.Humidity);
                //_yView = Math.Max(maxTemperature.Temperature, maxHumidity.Humidity) - _yViewAdjust;

                _yViewAdjust = 0;
                _yView = 110;
            }
            else
            {
                _yView = 0;
            }

            AdjustScroll(fieldLenghtPxs - canvas.ActualWidth);
        }

        private void ScrollBar_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (_lockObjects)
            {
                return;
            }

            PrintCanvas();
        }

        private void AdjustScroll(double maximum)
        {
            if (maximum < 1)
            {
                scroll.Maximum = 0;
                scroll.Value = 0;
            }
            else
            {
                var newValue = scroll.Maximum > 0 ?
                    (scroll.Value * maximum) / scroll.Maximum :
                    0;

                scroll.Maximum = maximum;
                scroll.Value = newValue;
            }
        }

        private void PrintCanvas()
        {
            var indexIni = Math.Abs(scroll.Value / slider.Value);
            var indexEnd = Math.Ceiling((scroll.Value + canvas.ActualWidth) / slider.Value);

            var realIndexIni = (int)Math.Min(indexIni, 0);
            var realIndexEnd = Math.Min(indexEnd, _data.Count);

            var itemCount = realIndexEnd - realIndexIni;
            var xPos = (realIndexIni % slider.Value) * -1;

            canvas.Children.Clear();
            if (itemCount > 1)
            {
                var yTemperaturePos = ((_data[realIndexIni].Temperature - _yViewAdjust) * canvas.ActualHeight) / _yView;
                var yHumidityPos = ((_data[realIndexIni].Humidity - _yViewAdjust) * canvas.ActualHeight) / _yView;
                var tempSwitch = _data[realIndexIni].TemperatureSwitch;
                var humiSwitch = _data[realIndexIni].HumiditySwitch;

                for (var i = 1; i < itemCount; i++)
                {
                    var data = _data[realIndexIni + i];
                    var xPosEnd = xPos + slider.Value;

                    var tempLine = new Line();
                    tempLine.Stroke = tempSwitch ? Brushes.MediumVioletRed : Brushes.MediumBlue;
                    tempLine.StrokeThickness = 3;
                    tempLine.X1 = xPos;
                    tempLine.Y1 = canvas.ActualHeight - yTemperaturePos;
                    yTemperaturePos = ((data.Temperature - _yViewAdjust) * canvas.ActualHeight) / _yView;
                    tempLine.X2 = xPosEnd;
                    tempLine.Y2 = canvas.ActualHeight - yTemperaturePos;
                    canvas.Children.Add(tempLine);

                    var humiLine = new Line();
                    humiLine.Stroke = humiSwitch ? Brushes.SaddleBrown : Brushes.DarkGray;
                    humiLine.StrokeThickness = 3;
                    humiLine.X1 = xPos;
                    humiLine.Y1 = canvas.ActualHeight - yHumidityPos;
                    yHumidityPos = ((data.Humidity - _yViewAdjust) * canvas.ActualHeight) / _yView;
                    humiLine.X2 = xPosEnd;
                    humiLine.Y2 = canvas.ActualHeight - yHumidityPos;
                    canvas.Children.Add(humiLine);

                    xPos = xPosEnd;
                    tempSwitch = data.TemperatureSwitch;
                    humiSwitch = data.HumiditySwitch;
                }
            }
        }

        private void Canvas_MouseDown(object sender, MouseButtonEventArgs e)
        {
            var mouse = Mouse.GetPosition(canvas);

            var clickIndex = (int)((mouse.X + scroll.Value) / slider.Value);

            if (clickIndex < _data.Count)
            {
                ShowInfo(_data[clickIndex]);
            }
            else
            {
                ShowInfo(null);
            }
        }

        private void ShowInfo(TempHumiSensorGraphModel data)
        {
            if (data == null)
            {
                tbDateTime.Text = string.Empty;
                tbTemp.Text = string.Empty;
                tbHumi.Text = string.Empty;
            }
            else
            {
                tbDateTime.Text = data.DateTime.ToString();
                tbTemp.Text = string.Format("{0}C° - {1}", data.Temperature.ToString(), data.TemperatureSwitch ? "Open" : "Closed");
                tbHumi.Text = string.Format("{0}% - {1}", data.Humidity.ToString(), data.HumiditySwitch ? "Open" : "Closed");
            }
        }
    }
}