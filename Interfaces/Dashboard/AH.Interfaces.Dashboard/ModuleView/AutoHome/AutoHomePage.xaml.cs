using AH.Protocol.Library.Messages.AutoHome;
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

namespace AH.Interfaces.Dashboard.ModuleView.AutoHome
{
    public partial class AutoHomePage : Page
    {
        private AutoHomeContext _context;

        public AutoHomePage()
        {
            InitializeComponent();

            SetContext();
            SetModuleData();
            App.Instance.SelectedChanged += Instance_SelectedChanged;
        }

        private void Instance_SelectedChanged()
        {
            SetModuleData();
        }

        private void SetContext()
        {
            _context = new AutoHomeContext
            {
                Wifis = new System.Collections.ObjectModel.ObservableCollection<ConfigurationWifi>()
            };
            DataContext = _context;
        }

        private void SetModuleData()
        {
            if (App.Instance.Selected != null)
            {
                _context.UID = App.Instance.Selected.UID;
                _context.RaiseNotify(nameof(_context.UID));
                _context.Alias = App.Instance.Selected.Alias;
                _context.RaiseNotify(nameof(_context.Alias));
                _context.FirmwareVersion = 0;
                _context.RaiseNotify(nameof(_context.FirmwareVersion));
                _context.HasSelected = true;
                _context.RaiseNotify("HasSelected");
            }
        }

        private async void Configuration_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    var content = await tcp.SendAndReceive<ConfigurationReadResponse>(new ConfigurationReadRequest());

                    _context.Wifis = new System.Collections.ObjectModel.ObservableCollection<ConfigurationWifi>(content.Wifis);
                    _context.RaiseNotify(nameof(_context.Wifis));
                    _context.Alias = content.Alias;
                    _context.RaiseNotify(nameof(_context.Alias));
                    _context.FirmwareVersion = content.FirmwareVersion;
                    _context.RaiseNotify(nameof(_context.FirmwareVersion));
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
                if (_context.Wifis.Count > 10)
                {
                    throw new Exception("Max wifi configuration is 10!");
                }

                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new ConfigurationSaveRequest
                    {
                        Wifis = _context.Wifis.ToList(),
                        Alias = _context.Alias
                    });
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void UID_Save_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new UIDSaveRequest
                    {
                        UID = (byte)_context.UID
                    });

                    App.Instance.Selected.UID = (byte)_context.UID;
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private async void Configuration_Restart_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = App.Instance.ConnectTCP())
                {
                    await tcp.Send(new SystemRestartRequest());
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
