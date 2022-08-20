using AH.Protocol.Library.Messages.CellingFan;
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

namespace AH.Interfaces.Dashboard.ModuleView.CellingFan
{
    public partial class CellingFanPage : Page
    {
        private CellingFanContext _context;
        private bool _disableEvents;

        public CellingFanPage()
        {
            InitializeComponent();

            SetContext();
        }

        private void SetContext()
        {
            _context = new CellingFanContext
            {
            };
            DataContext = _context;
        }

        private async void Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    var content = await tcp.SendAndReceive<StateReadResponse>(new StateReadRequest());

                    _disableEvents = true;
                    _context.LightOn = content.Light;
                    _context.RaiseNotify("LightOn");
                    _context.LightOff = !content.Light;
                    _context.RaiseNotify("LightOff");
                    _context.FanOn = content.Fan;
                    _context.RaiseNotify("FanOn");
                    _context.FanOff = !content.Fan;
                    _context.RaiseNotify("FanOff");
                    _context.OrientationUp = content.FanUp;
                    _context.RaiseNotify("OrientationUp");
                    _context.OrientationDown = !content.FanUp;
                    _context.RaiseNotify("OrientationDown");
                    _context.SpeedMin = content.FanSpeed == FanSpeedEnum.Min;
                    _context.RaiseNotify("SpeedMin");
                    _context.SpeedMedium = content.FanSpeed == FanSpeedEnum.Medium;
                    _context.RaiseNotify("SpeedMedium");
                    _context.SpeedMax = content.FanSpeed == FanSpeedEnum.Max;
                    _context.RaiseNotify("SpeedMax");
                    _disableEvents = false;
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void LightOn_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                { 
                    await tcp.Send(new StateSaveRequest
                    {
                        SetLight = true,
                        Light = true
                    });
                }

                _disableEvents = true;
                _context.LightOff = false;
                _context.RaiseNotify("LightOff");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void LightOff_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        SetLight = true,
                        Light = false
                    });
                }

                _disableEvents = true;
                _context.LightOn = false;
                _context.RaiseNotify("LightOn");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void FanOn_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        SetFan = true,
                        Fan = true
                    });
                }

                _disableEvents = true;
                _context.FanOff = false;
                _context.RaiseNotify("FanOff");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void FanOff_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        SetFan = true,
                        Fan = false
                    });
                }

                _disableEvents = true;
                _context.FanOn = false;
                _context.RaiseNotify("FanOn");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void OrientationUp_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        SetFanUp = true,
                        FanUp = true
                    });
                }

                _disableEvents = true;
                _context.OrientationDown = false;
                _context.RaiseNotify("OrientationDown");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void OrientationDown_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        SetFanUp = true,
                        FanUp = false
                    });
                }

                _disableEvents = true;
                _context.OrientationUp = false;
                _context.RaiseNotify("OrientationUp");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void FanSpeedMin_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        FanSpeed = FanSpeedEnum.Min
                    });
                }

                _disableEvents = true;
                _context.SpeedMedium = false;
                _context.RaiseNotify("SpeedMedium");
                _context.SpeedMax = false;
                _context.RaiseNotify("SpeedMax");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void FanSpeedMedium_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        FanSpeed = FanSpeedEnum.Medium
                    });
                }

                _disableEvents = true;
                _context.SpeedMin = false;
                _context.RaiseNotify("SpeedMin");
                _context.SpeedMax = false;
                _context.RaiseNotify("SpeedMax");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void FanSpeedMax_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new StateSaveRequest
                    {
                        FanSpeed = FanSpeedEnum.Max
                    });
                }

                _disableEvents = true;
                _context.SpeedMin = false;
                _context.RaiseNotify("SpeedMin");
                _context.SpeedMedium = false;
                _context.RaiseNotify("SpeedMedium");
                _disableEvents = false;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
