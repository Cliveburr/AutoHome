using System;
using System.IO;

namespace AH.Protocol.Library
{
    public class Message
    {
        public byte UID { get; set; }
        public MessageType Type { get; set; }
        public IContentMessage Content { get; set; }

        private byte[] _msg;
        private MemoryStream _mem;
        private BinaryReader _reader;

        public Message(byte[] msg)
        {
            _msg = msg;
            _mem = new MemoryStream(_msg);
            _reader = new BinaryReader(_mem);

            UID = _reader.ReadByte();
            Type = (MessageType)_reader.ReadByte();
        }

        public Message(byte UID, IContentMessage content)
        {
            this.UID = UID;
            Type = content.Type;
            Content = content;
        }

        public T ReadContent<T>() where T : IContentMessage
        {
            var content = Activator.CreateInstance<T>();

            if (content.Type != Type)
            {
                throw new Exception("Content type incorret!");
            }

            content.Read(_reader);

            return content;
        }

        public byte[] GetBytes()
        {
            using (var mem = new MemoryStream())
            using (var writer = new BinaryWriter(mem))
            {
                writer.Write(UID);

                writer.Write((byte)Type);

                Content.Write(writer);

                return mem.ToArray();
            }
        }
    }
}