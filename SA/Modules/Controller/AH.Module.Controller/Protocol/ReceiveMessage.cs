using System;
using System.IO;

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
            content.Parse(_reader);
            return content;
        }
    }

    public interface IReceiveContent
    {
        void Parse(BinaryReader reader);
    }
}