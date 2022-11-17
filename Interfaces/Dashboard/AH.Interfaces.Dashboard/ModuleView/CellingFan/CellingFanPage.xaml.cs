using AH.Protocol.Library.Messages.CellingFan;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
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
        private Timer _continueTest;
        private bool _continueTestValue = true;

        public CellingFanPage()
        {
            SetContext();

            InitializeComponent();

            //_continueTest = new Timer();
            //_continueTest.Elapsed += _continueTest_Elapsed;
            //_continueTest.Interval = 3500;
            //_continueTest.Start();
        }

        private async void _continueTest_Elapsed(object sender, ElapsedEventArgs e)
        {
            using (var tcp = App.Instance.ConnectTCP())
            {
                await tcp.Send(new StateSaveRequest
                {
                    SetFan = true,
                    Fan = _continueTestValue
                    //SetLight = true,
                    //Light = _continueTestValue
                });
            }

            _continueTestValue ^= true;
        }

        private void SetContext()
        {
            _context = new CellingFanContext();
            DataContext = _context;
        }

        private async void Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    var content = await tcp.SendAndReceive<StateReadResponse>(new StateReadRequest());
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void UpdateState(bool light, bool fan, bool fanUp, FanSpeedEnum fanSpeed)
        {
            _disableEvents = true;
            _context.LightOn = light;
            _context.RaiseNotify("LightOn");
            _context.LightOff = !light;
            _context.RaiseNotify("LightOff");
            _context.FanOn = fan;
            _context.RaiseNotify("FanOn");
            _context.FanOff = !fan;
            _context.RaiseNotify("FanOff");
            _context.OrientationUp = fanUp;
            _context.RaiseNotify("OrientationUp");
            _context.OrientationDown = !fanUp;
            _context.RaiseNotify("OrientationDown");
            _context.SpeedMin = fanSpeed == FanSpeedEnum.Min;
            _context.RaiseNotify("SpeedMin");
            _context.SpeedMedium = fanSpeed == FanSpeedEnum.Medium;
            _context.RaiseNotify("SpeedMedium");
            _context.SpeedMax = fanSpeed == FanSpeedEnum.Max;
            _context.RaiseNotify("SpeedMax");
            _disableEvents = false;

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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        SetLight = true,
                        Light = true
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        SetLight = true,
                        Light = false
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        SetFan = true,
                        Fan = true
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        SetFan = true,
                        Fan = false
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        SetFanUp = true,
                        FanUp = true
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        SetFanUp = true,
                        FanUp = false
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        FanSpeed = FanSpeedEnum.Min
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        FanSpeed = FanSpeedEnum.Medium
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
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
                    var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
                    {
                        FanSpeed = FanSpeedEnum.Max
                    });
                    UpdateState(content.Light, content.Fan, content.FanUp, content.FanSpeed);
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void Configuration_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    var content = await tcp.SendAndReceive<ConfigReadResponse>(new ConfigReadRequest());

                    _context.ConfigInterruptionsOnOff = content.InterruptionsOnOff;
                    _context.RaiseNotify(nameof(_context.ConfigInterruptionsOnOff));
                    _context.ConfigFW1FW2Inversion = content.FW1FW2Inversion;
                    _context.RaiseNotify(nameof(_context.ConfigFW1FW2Inversion));
                    _context.ConfigFI1FI2Inversion = content.FI1FI2Inversion;
                    _context.RaiseNotify(nameof(_context.ConfigFI1FI2Inversion));
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void Configuration_Save_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new ConfigSaveRequest
                    {
                        InterruptionsOnOff = _context.ConfigInterruptionsOnOff,
                        FW1FW2Inversion = _context.ConfigFW1FW2Inversion,
                        FI1FI2Inversion = _context.ConfigFI1FI2Inversion
                    });
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
