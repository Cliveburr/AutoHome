using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Net;
using System.Timers;

namespace AH.Interface.Android.Protocol
{
    public class AutoHomeProtocol : IDisposable
    {
        public delegate void ReceivePongDelegate(string address, Exception err);
        public event ReceivePongDelegate ReceivePong;
        public int ReceivePort { get; private set; }
        public int SendPort { get; private set; }

        private UdpClient _receiver;
        private UdpClient _sender;
        private Task _receiverTask;
        private Timer _pingTimeout;

        public AutoHomeProtocol(int receivePort, int sendPort)
        {
            ReceivePort = receivePort;
            SendPort = sendPort;

            _receiver = new UdpClient(receivePort);
            _sender = new UdpClient();
        }

        private async void Receive()
        {
            while (true)
            {
                try
                {
                    var receive = await _receiver.ReceiveAsync();

                    if (receive.Buffer[4] == 4)
                    {
                        _pingTimeout.Stop();

                        var apiPort = BitConverter.ToInt32(receive.Buffer, 5);
                        ReceivePong?.Invoke($"{receive.RemoteEndPoint.Address.ToString()}:{apiPort.ToString()}", null);
                    }
                }
                catch (ObjectDisposedException err)
                {
                    break;
                }
                catch (Exception err)
                {
                    ReceivePong?.Invoke(null, err);
                    break;
                }
            }
        }

        public void SendPing()
        {
            try
            {
                var bytes = new byte[] { 0, 0, 1, 0, 3 };

                var ip = new IPEndPoint(IPAddress.Broadcast, SendPort);

                _sender.Send(bytes, bytes.Length, ip);

                _pingTimeout = new Timer();
                _pingTimeout.Interval = 3000;
                _pingTimeout.Elapsed += PingTimeout_Elapsed;
                _pingTimeout.Start();
            }
            catch (SocketException err)
            {
                switch (err.ErrorCode)
                {
                    case 10051: ReceivePong?.Invoke(null, new SafeException("Without connection! Please connect to the ethernet!")); break;
                    default: ReceivePong?.Invoke(null, err); break;
                }
            }
            catch (Exception err)
            {
                ReceivePong?.Invoke(null, err);
            }
        }

        public void StartListening()
        {
            _receiverTask = Task.Run(new Action(Receive));
        }

        private void PingTimeout_Elapsed(object sender, ElapsedEventArgs e)
        {
            _pingTimeout.Stop();
            ReceivePong?.Invoke(null, new TimeoutException("Timeout"));
        }

        public void Dispose()
        {
            _pingTimeout = null;
            _receiver.Close();
            if (_receiverTask != null)
                _receiverTask.Dispose();
            _sender.Close();
        }
    }
}