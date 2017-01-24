using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class Program
    {
        public static void Main(string[] args)
        {
            new Sender().Send();
        }
    }

    public class Sender
    {
        public async void Send()
        {
            var client = new UdpClient();
            var ip = new IPEndPoint(IPAddress.Broadcast, 16000);
            byte[] bytes = Encoding.ASCII.GetBytes("Foo 2");
            await client.SendAsync(bytes, bytes.Length, ip);
        }
    }
}
