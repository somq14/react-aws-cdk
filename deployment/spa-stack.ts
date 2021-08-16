import * as cdk from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import { Duration } from "@aws-cdk/core";
import * as origins from "@aws-cdk/aws-cloudfront-origins";

export type SpaStackProps = {};

export class SpaStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props?: cdk.StackProps & SpaStackProps
  ) {
    super(scope, id, props);

    // 配信するコンテンツを配置する S3 バケット
    const originBucket = new s3.Bucket(this, "OriginBucket");

    // CloudFront のログを配置する S3 バケット
    const logBucket = new s3.Bucket(this, "LogBucket");

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      // 配信するコンテンツを指定する
      defaultBehavior: {
        origin: new origins.S3Origin(originBucket),
      },
      // ログの出力先を設定する
      logBucket: logBucket,

      // ルートへのアクセスに対して返却するコンテンツを設定する
      defaultRootObject: "index.html",
      errorResponses: [
        // S3 に指定されたファイルが存在しないとき、S3 は 403 エラーを返すが、
        // CloudFront により エラーを index.html の返却に置き換える
        // (SPA では、どの画面についても、index.html により表示を行うため)
        // https://aws.amazon.com/jp/premiumsupport/knowledge-center/s3-website-cloudfront-error-403/
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5),
        },
      ],

      // 日本を含む地域のエッジロケーションからコンテンツを配信する
      // https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/PriceClass.html
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
    });

    // build ディレクトリを S3 にアップロードして、アプリケーションをデプロイする
    new s3deploy.BucketDeployment(this, "Deployment", {
      sources: [s3deploy.Source.asset("./build")],
      destinationBucket: originBucket,
      // CloudFront のキャッシュを削除し、コンテンツを最新化する
      distribution: distribution,
    });
  }
}
