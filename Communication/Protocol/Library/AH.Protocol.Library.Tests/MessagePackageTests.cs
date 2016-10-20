using AH.Protocol.Library;
using System;
using Xunit;

namespace AH.Protocol.Library.Tests
{
    public class MessagePackageTests
    {
        [Fact]
        public void FullTest() 
        {
            var message = new MessagePackage
            {
                SenderUID = 123,
                ReceiverUID = 789,
                MessageID = 6,
                Configuration = MessageConfigurationEnum.IsConfirmation,
                MessageBody = System.Text.Encoding.ASCII.GetBytes("One test!!")
            };

            var messageBytes = message.GetMessage();

            var messageBack = MessagePackage.Parse(messageBytes);

            Assert.Equal(message.SenderUID, messageBack.SenderUID);

            Assert.Equal(message.ReceiverUID, messageBack.ReceiverUID);

            Assert.Equal(message.MessageID, messageBack.MessageID);

            Assert.Equal(message.Configuration, messageBack.Configuration);

            Assert.Equal(
                System.Text.Encoding.ASCII.GetString(message.MessageBody),
                System.Text.Encoding.ASCII.GetString(messageBack.MessageBody));
        }
    }
}