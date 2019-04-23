using AH.Protocol.Library;
using AH.Protocol.Library.Messages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    class Program
    {
        public static AutoHomeSimulator AutoHome { get; set; }
        public static byte UID { get; set; }
        public static string Alias { get; set; }
        public static string WifiName { get; set; }
        public static string WifiPassword { get; set; }

        public static uint RedHigh { get; set; }
        public static uint RedLow { get; set; }
        public static uint GreenHigh { get; set; }
        public static uint GreenLow { get; set; }
        public static uint BlueHigh { get; set; }
        public static uint BlueLow { get; set; }

        static void Main(string[] args)
        {
            Log("AutoHome Module Simulation");

            UID = 6;
            Alias = "Simulator";
            WifiName = "";
            WifiPassword = "";

            var sendPort = 15556;
            var receivePort = 15555;

            AutoHome = new AutoHomeSimulator(receivePort, sendPort);
            AutoHome.OnUdpReceived += AutoHome_OnUdpReceived;
            AutoHome.OnTcpReceived += AutoHome_OnTcpReceived;

            Console.ReadKey();
        }

        public static void Log(string msg)
        {
            Console.WriteLine(msg);
        }

        private static void AutoHome_OnUdpReceived(IPAddress address, Message message)
        {
            if (message.Type != MessageType.Ping)
                return;

            var content = message.ReadContent<PingSendMessage>();

            if (!content.IsValid)
                return;

            Log("Udp Received - Ping");

            AutoHome.SendUdp(address, new Message(UID, new PongReceiveMessage
            {
                ModuleType = ModuleType.LedRibbonRgb,
                Alias = Alias
            }));
        }

        private static void AutoHome_OnTcpReceived(TcpClient client, Message message)
        {
            switch (message.Type)
            {
                case MessageType.ConfigurationReadRequest:
                    {
                        Log("Tcp Received - ConfigurationReadRequest");

                        var response = new Message(UID, new ConfigurationReadResponse
                        {
                            Alias = Alias,
                            WifiName = WifiName,
                            WifiPassword = WifiPassword
                        });
                        var buffer = response.GetBytes();
                        client.Client.Send(buffer, buffer.Length, SocketFlags.None);
                        break;
                    }
                case MessageType.ConfigurationSaveRequest:
                    {
                        Log("Tcp Received - ConfigurationSaveRequest");

                        var content = message.ReadContent<ConfigurationSaveRequest>();

                        Alias = content.Alias;
                        WifiName = content.WifiName;
                        WifiPassword = content.WifiPassword;

                        break;
                    }
                case MessageType.RGBLedRibbonReadStateRequest:
                    {
                        Log("Tcp Received - RGBLedRibbonReadStateRequest");
                        Log($"RedLow: {RedLow.ToString()}");
                        Log($"RedHigh: {RedHigh.ToString()}");
                        Log($"GreenLow: {GreenLow.ToString()}");
                        Log($"GreenHigh: {GreenHigh.ToString()}");
                        Log($"BlueLow: {BlueLow.ToString()}");
                        Log($"BlueHigh: {BlueHigh.ToString()}");

                        var response = new Message(UID, new RGBLedRibbonReadStateResponse
                        {
                            RedLow = RedLow,
                            RedHigh = RedHigh,
                            GreenLow = GreenLow,
                            GreenHigh = GreenHigh,
                            BlueLow = BlueLow,
                            BlueHigh = BlueHigh
                        });
                        var buffer = response.GetBytes();
                        client.Client.Send(buffer, buffer.Length, SocketFlags.None);
                        break;
                    }
                case MessageType.RGBLedRibbonChangeRequest:
                    {
                        Log("Tcp Received - RGBLedRibbonChangeRequest");

                        var content = message.ReadContent<RGBLedRibbonChangeRequest>();

                        RedLow = content.RedLow;
                        RedHigh = content.RedHigh;
                        GreenLow = content.GreenLow;
                        GreenHigh = content.GreenHigh;
                        BlueLow = content.BlueLow;
                        BlueHigh = content.BlueHigh;

                        Log($"RedLow: {RedLow.ToString()}");
                        Log($"RedHigh: {RedHigh.ToString()}");
                        Log($"GreenLow: {GreenLow.ToString()}");
                        Log($"GreenHigh: {GreenHigh.ToString()}");
                        Log($"BlueLow: {BlueLow.ToString()}");
                        Log($"BlueHigh: {BlueHigh.ToString()}");

                        break;
                    }
            }
        }
    }
}