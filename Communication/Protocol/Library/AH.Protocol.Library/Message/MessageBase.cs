using System.IO;

namespace AH.Protocol.Library.Message
{
    public abstract class MessageBase
    {
        public ushort SenderUID { get; set; }
        public ushort ReceiverUID { get; set; }
        public MessageType Type { get; set; }

        public IContentMessage Content { get; set; }

        private BinaryReader _stream;

        public MessageBase(BinaryReader stream)
        {
            _stream = stream;
        }

        public MessageBase(ushort receiverUID, MessageType type, IContentMessage content = null)
        {
            ReceiverUID = receiverUID;
            Type = type;
            Content = content;
        }

        public virtual void GetStream(BinaryWriter stream)
        {
            stream.Write(SenderUID);
            stream.Write(ReceiverUID);
            stream.Write((byte)Type);
        }

        public virtual void Parse()
        {
            SenderUID = _stream.ReadUInt16();
            ReceiverUID = _stream.ReadUInt16();
            Type = (MessageType)_stream.ReadByte();
        }

        public void ParseContent(IContentMessage content)
        {
            content.Parse(_stream);
        }
    }
}