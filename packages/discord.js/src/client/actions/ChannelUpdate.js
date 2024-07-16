'use strict';

const Action = require('./Action');
const { createChannel } = require('../../util/Channels');
const Events = require('../../util/Events');

class ChannelUpdateAction extends Action {
  handle(data) {
    const client = this.client;
    let channel = client.channels.cache.get(data.id);

    if (channel) {
      if (channel.type !== data.type) {
        console.trace();
        client.emit(
          Events.Debug,
          `[THREAD-TEXT]: Channel Type Change ${channel.id}: (${channel.type} -> ${data.type})`,
        );
        client.emit(Events.Debug, JSON.stringify({ data, channel }));
      }

      const old = channel._update(data);

      if (channel.type !== data.type) {
        const newChannel = createChannel(this.client, data, channel.guild);

        if (!newChannel) {
          this.client.channels.cache.delete(channel.id);
          return {};
        }

        if (channel.isTextBased() && newChannel.isTextBased()) {
          for (const [id, message] of channel.messages.cache) newChannel.messages.cache.set(id, message);
        }

        channel = newChannel;
        this.client.channels.cache.set(channel.id, channel);
      }

      return {
        old,
        updated: channel,
      };
    } else {
      client.channels._add(data);
    }

    return {};
  }
}

module.exports = ChannelUpdateAction;
