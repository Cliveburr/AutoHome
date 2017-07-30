using AH.Module.Controller.Messages.AutoHome;
using AH.Module.Controller.Protocol;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Net;
using System.Net.Sockets;
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

namespace AH.Module.Controller
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private ControllerContext _context;

        public MainWindow()
        {
            InitializeComponent();

            //var testFlashFuncs = new TestFlashFuncs();
            //testFlashFuncs.RunTests();

            //Task.Run((Action)ReceiveUdp);


            //var udp = new UdpClient();

            //var ip = new IPEndPoint(IPAddress.Parse("192.168.4.255"), 15556);
            //var sendBuffer = Encoding.UTF8.GetBytes("PING"); //   new byte[] { 3, 2, 6, 7 };

            //udp.Send(sendBuffer, sendBuffer.Length, ip);

            Program.AutoHome.OnUdpRecevied += AutoHome_OnUdpRecevied;

            _context = new ControllerContext
            {
                SendPort = 15556,
                ReceivePort = 15555,
                ModuleList = new ObservableCollection<ControllerListItem>()
                //Selected = new ControllerListItem {  UID = 1, Ip = "192.168.0.1" },
            };

            Program.AutoHome = new AutoHome(_context.SendPort, _context.ReceivePort);

            DataContext = _context;
        }

        private void AutoHome_OnUdpRecevied(ReceiveMessage message)
        {
            if (message.Type != MessageType.Pong)
                return;

            var content = message.ParseContent<PongReceiveMessage>();

            if (!content.IsValid)
                return;

            _context.ModuleList.Add(new ControllerListItem { UID = message.UID, Ip = "192.168.0.1" });
        }

        private async void ReceiveUdp()
        {
            var udp = new UdpClient(15555);

            while (true)
            {
                var receive = await udp.ReceiveAsync();

                var data = Encoding.UTF8.GetString(receive.Buffer);
            }
        }

        private void RefreshList_Click(object sender, RoutedEventArgs e)
        {
            _context.ModuleList.Clear();
            //_context.ModuleList.Add(new ControllerListItem { UID = 1, Ip = "192.168.0.1" });
        }

        private void dgModules_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var selected = dgModules.SelectedItem as ControllerListItem;
            _context.Selected = selected;
            _context.RaiseNotify("Selected");
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            Program.Close();
        }

        private void ChangePorts_Click(object sender, RoutedEventArgs e)
        {
            Program.AutoHome?.Dispose();
            Program.AutoHome = new AutoHome(_context.SendPort, _context.ReceivePort);
        }
    }

    public class ControllerContext : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;

        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public ControllerListItem Selected { get; set; }
        public ObservableCollection<ControllerListItem> ModuleList { get; set; }

        public void RaiseNotify(string property)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(property));
        }
    }

    public class ControllerListItem
    {
        public int UID { get; set; }
        public string Ip { get; set; }
    }
}