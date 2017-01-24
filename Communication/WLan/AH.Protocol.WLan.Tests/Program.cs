using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.WLan.Tests
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var receive = new Receiver();
            receive.StartListening();

            Console.ReadKey();
        }
    }

    public class Receiver
    {
        private readonly UdpClient udp = new UdpClient(16000);

        public void StartListening()
        {
            Task.Run(new Action(Receive));
        }

        private async void Receive()
        {
            while (true)
            {
                var receive = await udp.ReceiveAsync();

                //IPEndPoint ip = new IPEndPoint(IPAddress.Any, 15000);

                var message = Encoding.ASCII.GetString(receive.Buffer);

                Console.WriteLine(message);
            }
        }
    }
}
