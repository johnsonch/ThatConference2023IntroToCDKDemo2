require 'aws-sdk'
require "datadog_api_client"
require "json"

def handler(event:, context:)
  # The name of the bucket passed in by the creation of the function
  bucket_name = ENV['BUCKET_NAME']
  # Create a timestamp file name
  timestamp = Time.now.utc.strftime('%Y%m%dT%H%M%S%z')
  file_name = "crash-log-#{timestamp}.json"

  # Write the timestamp file to S3
  s3 = Aws::S3::Client.new
  s3.put_object(bucket: bucket_name, key: file_name, body: event.to_json)
  log_file = Aws::S3::Object.new(bucket_name, file_name, client: Aws::S3::Client.new)

  # put container system log to s3 for crashed containers

  p event.inspect
  p log_file.inspect

  api_instance = DatadogAPIClient::V1::EventsAPI.new
  text_message = <<-MSG
    %%% \n
    ARN: #{event["detail"]["taskArn"]}
    REASON: #{event["detail"]["stoppedReason"]}
    CODE: #{event["detail"]["stopCode"]}
    [Event log](#{log_file.public_url})
    [Datadog log](https://app.datadoghq.com/logs?query=container_id%3Ad24b5637741d4cc5a6fa0927f536df45-2585065756)
    \n %%%
  MSG

  p text_message

  body = DatadogAPIClient::V1::EventCreateRequest.new({
    title: "Container Crashed",
    text: text_message,
    device_name: event["detail"]["taskArn"],
    source_type_name: 'amazon ecs',
    tags: [
      "test:ExampleEvent",
    ],
  })
  p api_instance.create_event(body)

  # Return a success response
  { statusCode: 200, body: 'Timestamp file written to S3' }
end
