using AH.Interfaces.Dashboard.Main.Discovery;
using AH.Protocol.Library;
using AH.Protocol.Library.Connection;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace AH.Interfaces.Dashboard
{
    public partial class App : Application
    {
        public delegate void SelectedChangedDelegate();
        public event SelectedChangedDelegate SelectedChanged;

        public static App Instance { get; private set; }
        public UdpConnection Connection { get; private set; }
        
        private DiscoveryModuleModel _selected;

        public App()
        {
            Instance = this;

            Config.ConfigFile.Load();
            Connection = new UdpConnection(0, 15862, 15863);
        }

        public DiscoveryModuleModel Selected
        {
            get
            {
                return _selected;
            }
            set
            {
                _selected = value;
                SelectedChanged?.Invoke();
            }
        }

        public void ErrorHandler(Exception err)
        {
            if (err is AggregateException)
            {
                err = ((AggregateException)err).InnerExceptions.First();
            }

            Dispatcher.Invoke(() =>
            {
                MessageBox.Show(err.ToString());
            });
        }

        public Task<T> SendAndReceive<T>(IContentMessage content) where T : IContentMessage
        {
            if (Selected == null)
            {
                throw new NullReferenceException("App.Selected not set!");
            }
            return Connection.SendAndReceive<T>(Selected.Ip, Selected.UID, content);
        }
    }
}
