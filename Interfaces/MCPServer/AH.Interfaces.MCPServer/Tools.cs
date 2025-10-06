using AH.Protocol.Library.Connection;
using AH.Protocol.Library.Messages.CellingFan;
using ModelContextProtocol.Server;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.MCPServer;

[McpServerToolType]
public sealed class Tools
{
    [McpServerTool, Description("Send a command to turn a room's light on or off")]
    public static async Task<string> LightCommand(
        [Description("True if it is to connect")] bool turnOn,
        [Description("Room to apply, valid values ​​[work, piano, tv, suite, kid]")] string room)
    {
        using (var tcp = OpenConnection(room))
        {
            var content = await tcp.SendAndReceive<StateSaveResponse>(new StateSaveRequest
            {
                SetLight = true,
                Light = turnOn
            });

            var isSuccess = content.Light == turnOn;

            return isSuccess ?
                "Command success!" :
                "Command fail!";
        }
    }

    private static TcpConnection OpenConnection(string room)
    {
        return room switch
        {
            "work" => new TcpConnection(0, 2, IPAddress.Parse("192.168.3.11"), 15862),
            "piano" => new TcpConnection(0, 1, IPAddress.Parse("192.168.3.10"), 15862),
            "tv" => new TcpConnection(0, 3, IPAddress.Parse("192.168.3.4"), 15862),
            "suite" => new TcpConnection(0, 2, IPAddress.Parse("192.168.3.11"), 15862),
            "kid" => new TcpConnection(0, 5, IPAddress.Parse("192.168.3.43"), 15862),
            _ => throw new Exception($"Invalid room {room}!")
        };
    }
}
