using RethinkDb.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public class Connection
    {
        public RethinkDb.Driver.Net.Connection Conn { get; private set; }
        public string Hostname { get; private set; }
        public int Port { get; private set; }

        public Connection(string hostname, int port)
        {
            Hostname = hostname;
            Port = port;
        }

        public void Check()
        {
            if (Conn == null)
            {
                Conn = RethinkDB.R.Connection()
                    .Hostname(Hostname)
                    .Port(Port)
                    .Timeout(60)
                    .Connect();
            }
            else
            {
                if (Conn.HasError)
                    Conn.Reconnect();

                Conn.CheckOpen();
            }
        }
    }
}