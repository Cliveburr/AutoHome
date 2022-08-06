using AH.Protocol.Library.Messages;
using System;
using System.IO;

namespace AH.Protocol.Library
{
    public class Message
    {
        public byte From_UID { get; set; }
        public byte To_UID { get; set; }
        public PortType Port { get; set; }
        public byte Msg { get; set; }
        public IContentMessage Content { get; set; }

        private byte[] _msg;
        private MemoryStream _mem;
        private BinaryReader _reader;

        public Message(byte[] msg)
        {
            _msg = msg;
            _mem = new MemoryStream(_msg);
            _reader = new BinaryReader(_mem);

            From_UID = _reader.ReadByte();
            To_UID = _reader.ReadByte();
            Port = (PortType)_reader.ReadByte();
            Msg = _reader.ReadByte();
        }

        public Message(byte fromUID, byte toUID, IContentMessage content)
        {
            From_UID = fromUID;
            To_UID = toUID;
            Port = content.Port;
            Msg = content.Msg;
            Content = content;
        }

        public T ReadContent<T>() where T : IContentMessage
        {
            var content = Activator.CreateInstance<T>();

            if (content.Port != Port)
            {
                throw new Exception("Port incorret!");
            }

            if (content.Msg != Msg)
            {
                throw new Exception("Msg incorret!");
            }

            content.Read(_reader);

            return content;
        }

        public byte[] GetBytes()
        {
            using (var mem = new MemoryStream())
            using (var writer = new BinaryWriter(mem))
            {
                writer.Write(From_UID);
                writer.Write(To_UID);
                writer.Write((byte)Port);
                writer.Write(Msg);
                Content.Write(writer);
                return mem.ToArray();
            }
        }
    }
}