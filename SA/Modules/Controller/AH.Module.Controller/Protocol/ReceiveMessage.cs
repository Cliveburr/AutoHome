using System;
using System.IO;
using System.Net;

namespace AH.Module.Controller.Protocol
{
    public class ReceiveMessage
    {
        private byte[] _msg;
        private MemoryStream _mem;
        private BinaryReader _reader;

        public byte UID { get; set; }
        public MessageType Type { get; set; }

        public ReceiveMessage(byte[] msg)
        {
            _msg = msg;
            _mem = new MemoryStream(_msg);
            _reader = new BinaryReader(_mem);

            UID = _reader.ReadByte();
            Type = (MessageType)_reader.ReadByte();
        }

        public T ParseContent<T>() where T: IReceiveContent
        {
            var content = Activator.CreateInstance<T>();

            if (content.Type != Type)
            {
                throw new Exception("Content type incorret!");
            }

            content.Parse(_reader);
            return content;
        }
    }

    public interface IReceiveContent
    {
        MessageType Type { get; }
        void Parse(BinaryReader reader);
    }
}