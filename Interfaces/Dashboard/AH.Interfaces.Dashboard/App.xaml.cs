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
        public UdpConnection UdpConnection { get; private set; }
        
        private DiscoveryModuleModel _selected;
        private const int _my_uid = 0;
        private const int _send_port = 15862;
        private const int _receive_port = 15863;

        public App()
        {
            Instance = this;

            Config.ConfigFile.Load();
            UdpConnection = new UdpConnection(_my_uid, _send_port, _receive_port);
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

        public Task<T> SendAndReceiveUDP<T>(IContentMessage content) where T : IContentMessage
        {
            if (Selected == null)
            {
                throw new NullReferenceException("App.Selected not set!");
            }
            return UdpConnection.SendAndReceive<T>(Selected.Ip, Selected.UID, content);
        }

        public TcpConnection ConnectTCP()
        {
            if (Selected == null)
            {
                throw new NullReferenceException("App.Selected not set!");
            }
            return new TcpConnection(_my_uid, Selected.UID, Selected.Ip, _send_port);
        }
    }
}
