const { IncomingWebhook } = require('@slack/client');
const log = require("./../log.js");

module.exports = {
  sendWebhook (req) {
    log.out('Inside Send Slack Webhook Plugin');
    
    const url = '***REMOVED***';
    const webhook = new IncomingWebhook(url);

    // Send simple text to the webhook channel
    webhook.send({
      channel: req.channel,
      text: 'This is a test from the flow container',
      attachments: [
        {
          "fallback": "This is a test.",
          "color": "#36a64f",
          "title": req.title,
          "text": req.message,
          "image_url": "http://my-website.com/path/to/image.jpg",
          "thumb_url": "http://example.com/path/to/thumb.png",
          "footer": "Boomerang Flow",
          "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
          "ts": 123456789
        }
      ]
    }, function(err, res) {
        if (err) {
          log.err(err);
        } else {
          log.out("Message sent: " + res.text);
        }
    });
  }
}
