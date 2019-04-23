using AH.Module.Controller.Helpers;
using AH.Protocol.Library;
using AH.Protocol.Library.Messages;
using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;

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

            _context = new ControllerContext
            {
                SendPort = 15556,
                ReceivePort = 15555,
                ModuleList = new ObservableCollection<ControllerListItem>(),
                Configuration = new ControllerConfiguration(),
                Fota = new ControllerFota
                {
                    User1bin = @"D:\ESP8266\VirtualBox\Share\NONOS_SDK\bin\upgrade\user1.4096.new.6.bin",
                    User2bin = @"D:\ESP8266\VirtualBox\Share\NONOS_SDK\bin\upgrade\user2.4096.new.6.bin"
                },
                RGBLR = new ControllerRGBLedRibbon
                {
                    PWMLengthRed = 10000,
                    PWMLengthGreen = 10000,
                    PWMLengthBlue = 10000
                }
                //Selected = new ControllerListItem {  UID = 1, Ip = "192.168.0.1" },
            };

            Program.AutoHome = new AutoHome(_context.SendPort, _context.ReceivePort);
            Program.AutoHome.OnUdpReceived += AutoHome_OnUdpRecevied;

            DataContext = _context;
        }

        private void AutoHome_OnUdpRecevied(IPAddress address, Message message)
        {
            if (message.Type != MessageType.Pong)
                return;

            var content = message.ReadContent<PongReceiveMessage>();

            if (!content.IsValid)
                return;

            Dispatcher.Invoke(() =>
            {
                _context.ModuleList.Add(new ControllerListItem
                {
                    UID = message.UID,
                    Alias = content.Alias,
                    Ip = address.ToString()
                });
            });
        }

        private void RefreshList_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                _context.ModuleList.Clear();
                //_context.ModuleList.Add(new ControllerListItem { UID = 1, Ip = "192.168.0.1" }); IPAddress.Parse(_context.Selected.Ip)
                Program.AutoHome.SendUdp(IPAddress.Broadcast, new Message(0, new PingSendMessage()));
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void dgModules_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            try
            {
                var selected = dgModules.SelectedItem as ControllerListItem;
                _context.Selected = selected;
                _context.RaiseNotify("Selected");
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            Program.Close();
        }

        private void ChangePorts_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Program.AutoHome?.Dispose();
                Program.AutoHome = new AutoHome(_context.SendPort, _context.ReceivePort);
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void CheckSelected()
        {
            if (_context.Selected != null)
            {
                if (_context.Selected.Ip != null)
                    return;
            }
            throw new Exception("Must select a valid IP!");
        }

        private void Configuration_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                CheckSelected();

                _context.Configuration = new ControllerConfiguration();
                _context.RaiseNotify("Configuration");

                using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                {
                    var receive = tcp.SendAndReceive(new Message((byte)_context.Selected.UID, new ConfigurationReadRequest()));

                    var content = receive.ReadContent<ConfigurationReadResponse>();

                    _context.Configuration.WifiName = content.WifiName;
                    _context.Configuration.Password = content.WifiPassword;
                    _context.Configuration.Alias = content.Alias;
                    _context.RaiseNotify("Configuration");
                }
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void Configuration_Save_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                CheckSelected();

                using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                {
                    tcp.Send(new Message((byte)_context.Selected.UID, new ConfigurationSaveRequest
                    {
                        WifiName = _context.Configuration.WifiName,
                        WifiPassword = _context.Configuration.Password,
                        Alias = _context.Configuration.Alias
                    }));
                }
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void Fota_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                CheckSelected();

                _context.Fota.NextUser = "reading...";
                _context.RaiseNotify("Fota");

                using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                {
                    var receive = tcp.SendAndReceive(new Message((byte)_context.Selected.UID, new FotaStateReadRequest()));

                    var content = receive.ReadContent<FotaStateReadResponse>();

                    _context.Fota.NextUser = content.UserBin == 1 ?
                        "User 1 bin" :
                        "User 2 bin";
                    _context.RaiseNotify("Fota");
                }
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void Fota_Flash_Click(object sender, RoutedEventArgs e)
        {
            var defaultCursor = Mouse.OverrideCursor;
            try
            {
                CheckSelected();

                Mouse.OverrideCursor = Cursors.Wait;
                pbFotaWrite.Value = 0;

                Task.Run(() =>
                {
                    using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                    {
                        var receive = tcp.SendAndReceive(new Message((byte)_context.Selected.UID, new FotaStateReadRequest()));

                        var content = receive.ReadContent<FotaStateReadResponse>();

                        var file = content.UserBin == 1 ?
                            _context.Fota.User1bin :
                            _context.Fota.User2bin;

                        if (!File.Exists(file))
                        {
                            throw new Exception("The file does not exist!");
                        }

                        var file_bytes = File.ReadAllBytes(file);
                        var chunks = file_bytes
                            .Select((x, i) => new { Index = i, Value = x })
                            .GroupBy(x => x.Index / content.ChunkSize)
                            .Select(x => x.Select(v => v.Value).ToList())
                            .ToList();

                        Dispatcher.Invoke(() =>
                        {
                            pbFotaWrite.Maximum = chunks.Count;
                        }, DispatcherPriority.Render);

                        tcp.Send(new Message((byte)_context.Selected.UID, new FotaStartRequest
                        {
                            FileSize = (uint)file_bytes.Length
                        }));

                        foreach (var chunk in chunks)
                        {
                            var writeReceive = tcp.SendAndReceive(new Message((byte)_context.Selected.UID, new FotaWriteRequest
                            {
                                Chunk = chunk.ToArray()
                            }));

                            var writeContent = writeReceive.ReadContent<FotaWriteResponse>();

                            Dispatcher.Invoke(() =>
                            {
                                pbFotaWrite.Value += 1;
                                Console.WriteLine(pbFotaWrite.Value);
                            }, DispatcherPriority.Render);

                            if (writeContent.IsOver)
                            {
                                break;
                            }
                        }
                    }

                    Dispatcher.Invoke(() =>
                    {
                        Mouse.OverrideCursor = defaultCursor;
                    }, DispatcherPriority.Render);
                });
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
                Mouse.OverrideCursor = defaultCursor;
            }
        }

        private void Fota_User1Select_Click(object sender, RoutedEventArgs e)
        {
            var selectFile = new Microsoft.Win32.OpenFileDialog();

            selectFile.DefaultExt = ".bin";
            selectFile.Filter = "Binary (*.bin)|*.bin";

            if (selectFile.ShowDialog() == false)
                return;

            _context.Fota.User1bin = selectFile.FileName;
            _context.RaiseNotify("Fota");
        }

        private void Fota_User2Select_Click(object sender, RoutedEventArgs e)
        {
            var selectFile = new Microsoft.Win32.OpenFileDialog();

            selectFile.DefaultExt = ".bin";
            selectFile.Filter = "Binary (*.bin)|*.bin";

            if (selectFile.ShowDialog() == false)
                return;

            _context.Fota.User2bin = selectFile.FileName;
            _context.RaiseNotify("Fota");
        }

        private void RGBLR_Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                CheckSelected();

                _context.RGBLR = new ControllerRGBLedRibbon();
                _context.RaiseNotify("RGBLR");

                using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                {
                    var receive = tcp.SendAndReceive(new Message((byte)_context.Selected.UID, new RGBLedRibbonReadStateRequest()));

                    var content = receive.ReadContent<RGBLedRibbonReadStateResponse>();

                    var helper = ColorTransform.FromValues(
                        content.RedHigh,
                        content.RedLow,
                        content.GreenHigh,
                        content.GreenLow,
                        content.BlueHigh,
                        content.BlueLow);

                    _context.RGBLR.Color = helper.Color;
                    _context.RGBLR.PWMLengthRed = helper.RedLen;
                    _context.RGBLR.PWMLengthGreen = helper.GreenLen;
                    _context.RGBLR.PWMLengthBlue = helper.BlueLen;
                    _context.RaiseNotify("RGBLR");
                }
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }

        private void RGBLR_Change_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var update = false;
                if (_context.RGBLR.PWMLengthRed <= 10)
                {
                    _context.RGBLR.PWMLengthRed = 10000;
                    update = true;
                }
                if (_context.RGBLR.PWMLengthGreen <= 10)
                {
                    _context.RGBLR.PWMLengthGreen = 10000;
                    update = true;
                }
                if (_context.RGBLR.PWMLengthBlue <= 10)
                {
                    _context.RGBLR.PWMLengthBlue = 10000;
                    update = true;
                }
                if (update)
                {
                    _context.RaiseNotify("RGBLR");
                }

                CheckSelected();

                using (var tcp = Program.AutoHome.Connect(IPAddress.Parse(_context.Selected.Ip)))
                {
                    var helper = ColorTransform.FromColor(
                        _context.RGBLR.Color,
                        _context.RGBLR.PWMLengthRed,
                        _context.RGBLR.PWMLengthGreen,
                        _context.RGBLR.PWMLengthBlue);

                    tcp.Send(new Message((byte)_context.Selected.UID, new RGBLedRibbonChangeRequest
                    {
                        RedHigh = helper.RedHigh,
                        RedLow = helper.RedLow,
                        GreenHigh = helper.GreenHigh,
                        GreenLow = helper.GreenLow,
                        BlueHigh = helper.BlueHigh,
                        BlueLow = helper.BlueLow
                    }));
                }
            }
            catch (Exception err)
            {
                Program.ErrorHandler(err);
            }
        }
    }

    public class ControllerContext : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;

        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public ControllerListItem Selected { get; set; }
        public ObservableCollection<ControllerListItem> ModuleList { get; set; }
        public ControllerConfiguration Configuration { get; set; }
        public ControllerFota Fota { get; set; }
        public ControllerRGBLedRibbon RGBLR { get; set; }

        public void RaiseNotify(string property)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(property));
        }
    }

    public class ControllerListItem
    {
        public int UID { get; set; }
        public string Alias { get; set; }
        public string Ip { get; set; }
    }

    public class ControllerConfiguration
    {
        public string WifiName { get; set; }
        public string Password { get; set; }
        public string Alias { get; set; }
    }

    public class ControllerFota
    {
        public string User1bin { get; set; }
        public string User2bin { get; set; }
        public string NextUser { get; set; }
    }

    public class ControllerRGBLedRibbon
    {
        public long PWMLengthRed { get; set; }
        public long PWMLengthGreen { get; set; }
        public long PWMLengthBlue { get; set; }
        public Color Color { get; set; }
    }
}