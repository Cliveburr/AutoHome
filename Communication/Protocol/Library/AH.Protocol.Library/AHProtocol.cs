using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class AHProtocol : IAHProtocol
    {
        public int TimeOut { get; set; }
        public MessageArriveDelegate MessageArrive { get; set; }

        private ushort _UID;
        private byte _messageID;
        private IList<MessageStore> _messageStack;
        private IList<MessageStore> _messageQueue;
        private IList<MessageStore> _messageWaiting;
        private object _messageskLock = new object();
        private IPhysicalProtocolCouple _physicalCouple;

        private class MessageStore
        {
            public MessagePackage Package;
            public MessageArriveDelegate Callback;
            public Timer TimeoutTimer;
        }

        public AHProtocol(ushort UID, int timeOut, MessageArriveDelegate messageArrive, IPhysicalProtocolCouple physicalCouple)
        {
            _UID = UID;
            TimeOut = timeOut;
            MessageArrive = messageArrive;
            _messageID = 0;
            _messageStack = new List<MessageStore>();
            _messageQueue = new List<MessageStore>();
            _messageWaiting = new List<MessageStore>();
            _physicalCouple = physicalCouple;
            _physicalCouple.Receiver += Receiver;
            Task.Run(new Action(RunSenderStack));
        }

        public ushort UID
        {
            get
            {
                return _UID;
            }
        }

        public void Send(ushort receiverUID, byte[] messageBody, MessageArriveDelegate callBack = null)
        {
            var messsageID = _messageID++;

            var configuration = MessageConfigurationEnum.None;
            if (callBack != null)
                configuration |= MessageConfigurationEnum.NeedConfirmation;

            var package = new MessagePackage(_UID, receiverUID, messsageID, configuration, messageBody);

            var messageStore = new MessageStore
            {
                Package = package,
                Callback = callBack
            };

            var time = new Timer(WaitingTimeoutCallback, messageStore, TimeOut, Timeout.Infinite);
            messageStore.TimeoutTimer = time;

            lock (_messageskLock)
            {
                var hasInStack = _messageStack
                    .Where(ms => ms.Package.ReceiverUID == receiverUID);

                if (hasInStack.Any())
                {
                    _messageQueue.Add(messageStore);
                }
                else
                {
                    _messageStack.Add(messageStore);
                }

                Monitor.Pulse(_messageskLock);
            }
        }

        private void WaitingTimeoutCallback(object state)
        {
            var message = (MessageStore)state;

            message.TimeoutTimer?.Dispose();
            message.Callback?.Invoke(MessageArriveCode.Timeout, message.Package);

            lock (_messageskLock)
            {
                Monitor.Pulse(_messageskLock);
            }
        }

        private void RunSenderStack()
        {
            while (true)
            {
                MessageStore message;
                lock (_messageskLock)
                {
                    if (!_messageStack.Any())
                        Monitor.Wait(_messageskLock);

                    message = _messageStack.FirstOrDefault();

                    if (message == null)
                        continue;

                    _messageStack.Remove(message);
                }

                if (message.Callback != null)
                {
                    lock (_messageWaiting)
                    {
                        _messageWaiting.Add(message);
                    }
                }

                _physicalCouple.Send(message.Package);
            }
        }

        private void Receiver(MessagePackage package)
        {
            if (package.ReceiverUID != _UID)
                return;

            if ((package.Configuration & MessageConfigurationEnum.NeedConfirmation) != 0)
            {
                var packageConfirmation = new MessagePackage(_UID, package.SenderUID, package.MessageID, MessageConfigurationEnum.IsConfirmation, new byte[0]);

                var messageStack = new MessageStore
                {
                    Package = packageConfirmation
                };

                lock (_messageskLock)
                {
                    _messageStack.Add(messageStack);
                    Monitor.Pulse(_messageskLock);
                }
            }

            if ((package.Configuration & MessageConfigurationEnum.IsConfirmation) != 0)
            {
                MessageStore message;
                lock (_messageWaiting)
                {
                    message = _messageWaiting
                        .Where(s => s.Package.ReceiverUID == package.SenderUID && s.Package.MessageID == package.MessageID)
                        .FirstOrDefault();
                }

                if (message == null)
                {
                    Task.Run(() => MessageArrive(MessageArriveCode.ConfirmationWithoutWaiting, package));
                }
                else
                {
                    lock (_messageWaiting)
                    {
                        _messageWaiting.Remove(message);
                    }
                    message.TimeoutTimer?.Dispose();
                    message.Callback?.Invoke(MessageArriveCode.Ok, message.Package);
                }
            }
            else
            {
                var hasQueue = _messageQueue
                    .Where(s => s.Package.ReceiverUID == package.SenderUID)
                    .FirstOrDefault();

                if (hasQueue != null)
                {
                    lock (_messageskLock)
                    {
                        _messageQueue.Remove(hasQueue);

                        _messageStack.Add(hasQueue);

                        Monitor.Pulse(_messageskLock);
                    }
                }

                Task.Run(() => MessageArrive(MessageArriveCode.Ok, package));
            }
        }
    }
}