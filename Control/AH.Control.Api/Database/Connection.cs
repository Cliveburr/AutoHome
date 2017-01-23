using Microsoft.Extensions.Options;
using RethinkDb.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public interface IConnection
    {
        RethinkDb.Driver.Net.Connection Conn { get; }
        ConnectionOptions Options { get; }
        void Check();
    }

    public class Connection : IConnection
    {
        public RethinkDb.Driver.Net.Connection Conn { get; private set; }
        public ConnectionOptions Options { get; private set; }

        public Connection(IOptions<ConnectionOptions> options)
        {
            Options = options.Value;
        }

        public void Check()
        {
            if (Conn == null)
            {
                Conn = RethinkDB.R.Connection()
                    .Hostname(Options.Host)
                    .Port(Options.Port)
                    .Timeout(Options.Timeout)
                    .Connect();
            }
            else
            {
                if (Conn.HasError || !Conn.Open)
                    Conn.Reconnect();
            }

            Conn.CheckOpen();
        }
    }

    public class ConnectionOptions
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public int Timeout { get; set; }
    }
}