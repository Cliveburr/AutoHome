using AH.Interfaces.Dashboard.Config;
using AH.Protocol.Library.Messages.Fota;
using System;
using System.Collections.Generic;
using System.IO;
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
using System.Windows.Threading;

namespace AH.Interfaces.Dashboard.ModuleView.Fota
{
    public partial class FotaPage : Page
    {
        private ModuleViewConnector _connector;
        private FotaContext _context;

        public FotaPage(ModuleViewConnector connector)
        {
            InitializeComponent();

            _connector = connector;

            SetContext();
        }

        private void SetContext()
        {
            _context = new FotaContext
            {
                User1bin = ConfigFile.Data.User1FilePath,
                User2bin = ConfigFile.Data.User2FilePath
            };
            DataContext = _context;
        }

        private void Read_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                using (var tcp = _connector.OpenTcpConnection())
                {
                    var receive = tcp.SendAndReceive(new FotaStateReadRequest());

                    var content = receive.ReadContent<FotaStateReadResponse>();

                    _context.NextUser = content.UserBin == 1 ?
                        "User 1 bin" :
                        "User 2 bin";
                    _context.RaiseNotify("NextUser");

                    SetUserEnabled(content.UserBin);
                }
            }
            catch (Exception err)
            {
                App.Instance.ErrorHandler(err);
            }
        }

        private void Flash_Click(object sender, RoutedEventArgs e)
        {
            var defaultCursor = Mouse.OverrideCursor;
            try
            {
                if (string.IsNullOrEmpty(_context.NextUser))
                {
                    throw new Exception("Need to read before flash!");
                }

                Mouse.OverrideCursor = Cursors.Wait;
                pbFotaWrite.Value = 0;

                Task.Run(() =>
                {
                    using (var tcp = _connector.OpenTcpConnection())
                    {
                        var receive = tcp.SendAndReceive(new FotaStateReadRequest());

                        var content = receive.ReadContent<FotaStateReadResponse>();

                        var file = content.UserBin == 1 ?
                            _context.User1bin :
                            _context.User2bin;

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

                        tcp.Send(new FotaStartRequest
                        {
                            FileSize = (uint)file_bytes.Length
                        });

                        foreach (var chunk in chunks)
                        {
                            var writeReceive = tcp.SendAndReceive(new FotaWriteRequest
                            {
                                Chunk = chunk.ToArray()
                            });

                            var writeContent = writeReceive.ReadContent<FotaWriteResponse>();

                            Dispatcher.Invoke(() =>
                            {
                                pbFotaWrite.Value += 1;
                                Console.WriteLine(pbFotaWrite.Value);
                            }, DispatcherPriority.Render);

                            if (writeContent.IsOver)
                            {
                                _context.NextUser = string.Empty;
                                _context.RaiseNotify("NextUser");
                                WriteSuccess();

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
                App.Instance.ErrorHandler(err);
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

            _context.User1bin = selectFile.FileName;
            _context.RaiseNotify("User1bin");
        }

        private void Fota_User2Select_Click(object sender, RoutedEventArgs e)
        {
            var selectFile = new Microsoft.Win32.OpenFileDialog();

            selectFile.DefaultExt = ".bin";
            selectFile.Filter = "Binary (*.bin)|*.bin";

            if (selectFile.ShowDialog() == false)
                return;

            _context.User2bin = selectFile.FileName;
            _context.RaiseNotify("User2bin");
        }

        private void WriteSuccess()
        {
            ConfigFile.Data.User1FilePath = _context.User1bin;
            ConfigFile.Data.User2FilePath = _context.User2bin;
            ConfigFile.Save();

            Dispatcher.Invoke(() => SetUserEnabled(0));
        }

        private void SetUserEnabled(int value)
        {
            switch (value)
            {
                case -1:
                    dpUser1.IsEnabled = false;
                    dpUser2.IsEnabled = false;
                    break;
                case 1:
                    dpUser1.IsEnabled = true;
                    dpUser2.IsEnabled = false;
                    break;
                case 0:
                    dpUser1.IsEnabled = false;
                    dpUser2.IsEnabled = true;
                    break;
            }
        }
    }
}
