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
            };
            DataContext = _context;
        }

        private void SetModuleData()
        {
            if (App.Instance.Selected != null)
            {
                _context.UID = App.Instance.Selected.UID;
                _context.RaiseNotify("UID");
                _context.Alias = App.Instance.Selected.Alias;
                _context.RaiseNotify("Alias");
                _context.HasSelected = true;
                _context.RaiseNotify("HasSelected");
            }
        }

        private async void Configuration_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var content = await App.Instance.SendAndReceive<ConfigurationReadResponse>(new ConfigurationReadRequest());

                _context.WifiName = content.WifiName;
                _context.RaiseNotify("WifiName");
                _context.WifiPassword = content.WifiPassword;
                _context.RaiseNotify("WifiPassword");
                _context.Alias = content.Alias;
                _context.RaiseNotify("Alias");
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
                var _ = await App.Instance.SendAndReceive<ConfigurationSaveResponse>(new ConfigurationSaveRequest
                {
                    WifiName = _context.WifiName,
                    WifiPassword = _context.WifiPassword,
                    Alias = _context.Alias
                });
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
                var _ = await App.Instance.SendAndReceive<UIDSaveResponse>(new UIDSaveRequest
                {
                    UID = (byte)_context.UID
                });

                App.Instance.Selected.UID = (byte)_context.UID;
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }
    }
}
