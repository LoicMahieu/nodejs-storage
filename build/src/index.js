/**
 * Copyright 2014-2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const arrify = require("arrify");
const common_1 = require("@google-cloud/common");
const paginator_1 = require("@google-cloud/paginator");
const promisify_1 = require("@google-cloud/promisify");
const extend = require("extend");
const request = require("request");
const bucket_1 = require("./bucket");
exports.Bucket = bucket_1.Bucket;
const channel_1 = require("./channel");
exports.Channel = channel_1.Channel;
const file_1 = require("./file");
exports.File = file_1.File;
/**
 * @typedef {object} ClientConfig
 * @property {string} [projectId] The project ID from the Google Developer's
 *     Console, e.g. 'grape-spaceship-123'. We will also check the environment
 *     variable `GCLOUD_PROJECT` for your project ID. If your app is running in
 *     an environment which supports {@link
 * https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application
 * Application Default Credentials}, your project ID will be detected
 * automatically.
 * @property {string} [keyFilename] Full path to the a .json, .pem, or .p12 key
 *     downloaded from the Google Developers Console. If you provide a path to a
 *     JSON file, the `projectId` option above is not necessary. NOTE: .pem and
 *     .p12 require you to specify the `email` option as well.
 * @property {string} [email] Account email address. Required when using a .pem
 *     or .p12 keyFilename.
 * @property {object} [credentials] Credentials object.
 * @property {string} [credentials.client_email]
 * @property {string} [credentials.private_key]
 * @property {boolean} [autoRetry=true] Automatically retry requests if the
 *     response is related to rate limits or certain intermittent server errors.
 *     We will exponentially backoff subsequent requests by default.
 * @property {number} [maxRetries=3] Maximum number of automatic retries
 *     attempted before returning the error.
 * @property {Constructor} [promise] Custom promise module to use instead of
 *     native Promises.
 */
/*! Developer Documentation
 *
 * Invoke this method to create a new Storage object bound with pre-determined
 * configuration options. For each object that can be created (e.g., a bucket),
 * there is an equivalent static and instance method. While they are classes,
 * they can be instantiated without use of the `new` keyword.
 */
/**
 * <h4>ACLs</h4>
 * Cloud Storage uses access control lists (ACLs) to manage object and
 * bucket access. ACLs are the mechanism you use to share files with other users
 * and allow other users to access your buckets and files.
 *
 * To learn more about ACLs, read this overview on
 * [Access Control](https://cloud.google.com/storage/docs/access-control).
 *
 * @see [Cloud Storage overview]{@link https://cloud.google.com/storage/docs/overview}
 * @see [Access Control]{@link https://cloud.google.com/storage/docs/access-control}
 *
 * @class
 * @hideconstructor
 *
 * @example <caption>Create a client that uses Application Default Credentials
 * (ADC)</caption> const {Storage} = require('@google-cloud/storage'); const
 * storage = new Storage();
 *
 * @example <caption>Create a client with explicit credentials</caption>
 * storage');/storage');
 * const storage = new Storage({
 *   projectId: 'your-project-id',
 *   keyFilename: '/path/to/keyfile.json'
 * });
 *
 * @param {ClientConfig} [options] Configuration options.
 */
class Storage extends common_1.Service {
    constructor(options = {}) {
        const config = {
            baseUrl: 'https://www.googleapis.com/storage/v1',
            projectIdRequired: false,
            scopes: [
                'https://www.googleapis.com/auth/iam',
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/devstorage.full_control',
            ],
            packageJson: require('../../package.json'),
            requestModule: request,
        };
        super(config, options);
        /**
         * Reference to {@link Storage.acl}.
         *
         * @name Storage#acl
         * @see Storage.acl
         */
        this.acl = Storage.acl;
        this.getBucketsStream = paginator_1.paginator.streamify('getBuckets');
    }
    /**
     * Get a reference to a Cloud Storage bucket.
     *
     * @param {string} name Name of the bucket.
     * @param {object} [options] Configuration object.
     * @param {string} [options.kmsKeyName] A Cloud KMS key that will be used to
     *     encrypt objects inserted into this bucket, if no encryption method is
     *     specified.
     * @param {string} [options.userProject] User project to be billed for all
     *     requests made from this Bucket object.
     * @returns {Bucket}
     * @see Bucket
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const albums = storage.bucket('albums');
     * const photos = storage.bucket('photos');
     */
    bucket(name, options) {
        if (!name) {
            throw new Error('A bucket name is needed to use Cloud Storage.');
        }
        return new bucket_1.Bucket(this, name, options);
    }
    /**
     * Reference a channel to receive notifications about changes to your bucket.
     *
     * @param {string} id The ID of the channel.
     * @param {string} resourceId The resource ID of the channel.
     * @returns {Channel}
     * @see Channel
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const channel = storage.channel('id', 'resource-id');
     */
    channel(id, resourceId) {
        return new channel_1.Channel(this, id, resourceId);
    }
    createBucket(name, metadataOrCallback, callback) {
        if (!name) {
            throw new Error('A name is required to create a bucket.');
        }
        let metadata;
        if (!callback) {
            callback = metadataOrCallback;
            metadata = {};
        }
        else {
            metadata = metadataOrCallback;
        }
        const body = extend({}, metadata, {
            name,
        });
        const storageClasses = {
            coldline: 'COLDLINE',
            dra: 'DURABLE_REDUCED_AVAILABILITY',
            multiRegional: 'MULTI_REGIONAL',
            nearline: 'NEARLINE',
            regional: 'REGIONAL',
        };
        Object.keys(storageClasses).forEach(storageClass => {
            if (body[storageClass]) {
                body.storageClass = storageClasses[storageClass];
                delete body[storageClass];
            }
        });
        if (body.requesterPays) {
            body.billing = {
                requesterPays: body.requesterPays,
            };
            delete body.requesterPays;
        }
        const query = {
            project: this.projectId,
        };
        if (body.userProject) {
            query.userProject = body.userProject;
            delete body.userProject;
        }
        this.request({
            method: 'POST',
            uri: '/b',
            qs: query,
            json: body,
        }, (err, resp) => {
            if (err) {
                callback(err, null, resp);
                return;
            }
            const bucket = this.bucket(name);
            bucket.metadata = resp;
            callback(null, bucket, resp);
        });
    }
    /**
     * Query object for listing buckets.
     *
     * @typedef {object} GetBucketsRequest
     * @property {boolean} [autoPaginate=true] Have pagination handled
     *     automatically.
     * @property {number} [maxApiCalls] Maximum number of API calls to make.
     * @property {number} [maxResults] Maximum number of items plus prefixes to
     *     return.
     * @property {string} [pageToken] A previously-returned page token
     *     representing part of the larger set of results to view.
     * @property {string} [userProject] The ID of the project which will be billed
     *     for the request.
     */
    /**
     * @typedef {array} GetBucketsResponse
     * @property {Bucket[]} 0 Array of {@link Bucket} instances.
     */
    /**
     * @callback GetBucketsCallback
     * @param {?Error} err Request error, if any.
     * @param {Bucket[]} buckets Array of {@link Bucket} instances.
     */
    /**
     * Get Bucket objects for all of the buckets in your project.
     *
     * @see [Buckets: list API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/buckets/list}
     *
     * @param {GetBucketsRequest} [query] Query object for listing buckets.
     * @param {GetBucketsCallback} [callback] Callback function.
     * @returns {Promise<GetBucketsResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * storage.getBuckets(function(err, buckets) {
     *   if (!err) {
     *     // buckets is an array of Bucket objects.
     *   }
     * });
     *
     * //-
     * // To control how many API requests are made and page through the results
     * // manually, set `autoPaginate` to `false`.
     * //-
     * const callback = function(err, buckets, nextQuery, apiResponse) {
     *   if (nextQuery) {
     *     // More results exist.
     *     storage.getBuckets(nextQuery, callback);
     *   }
     *
     *   // The `metadata` property is populated for you with the metadata at the
     *   // time of fetching.
     *   buckets[0].metadata;
     *
     *   // However, in cases where you are concerned the metadata could have
     *   // changed, use the `getMetadata` method.
     *   buckets[0].getMetadata(function(err, metadata, apiResponse) {});
     * };
     *
     * storage.getBuckets({
     *   autoPaginate: false
     * }, callback);
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * storage.getBuckets().then(function(data) {
     *   const buckets = data[0];
     * });
     *
     * @example <caption>include:samples/buckets.js</caption>
     * region_tag:storage_list_buckets
     * Another example:
     */
    getBuckets(query, callback) {
        if (!callback) {
            callback = query;
            query = {};
        }
        query.project = query.project || this.projectId;
        this.request({
            uri: '/b',
            qs: query,
        }, (err, resp) => {
            if (err) {
                callback(err, null, null, resp);
                return;
            }
            const buckets = arrify(resp.items).map(bucket => {
                const bucketInstance = this.bucket(bucket.id);
                bucketInstance.metadata = bucket;
                return bucketInstance;
            });
            let nextQuery = null;
            if (resp.nextPageToken) {
                nextQuery = extend({}, query, { pageToken: resp.nextPageToken });
            }
            callback(null, buckets, nextQuery, resp);
        });
    }
    /**
     * @typedef {array} GetServiceAccountResponse
     * @property {object} 0 The service account resource.
     * @property {object} 1 The full
     * [API
     * response](https://cloud.google.com/storage/docs/json_api/v1/projects/serviceAccount#resource).
     */
    /**
     * @callback GetServiceAccountCallback
     * @param {?Error} err Request error, if any.
     * @param {object} serviceAccount The serviceAccount resource.
     * @param {string} serviceAccount.emailAddress The service account email
     *     address.
     * @param {object} apiResponse The full
     * [API
     * response](https://cloud.google.com/storage/docs/json_api/v1/projects/serviceAccount#resource).
     */
    /**
     * Get the email address of this project's Google Cloud Storage service
     * account.
     *
     * @see [Projects.serviceAccount: get API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/projects/serviceAccount/get}
     * @see [Projects.serviceAccount Resource]{@link https://cloud.google.com/storage/docs/json_api/v1/projects/serviceAccount#resource}
     *
     * @param {object} [options] Configuration object.
     * @param {string} [options.userProject] User project to be billed for this
     *     request.
     * @param {GetServiceAccountCallback} [callback] Callback function.
     * @returns {Promise<GetServiceAccountResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     *
     * storage.getServiceAccount(function(err, serviceAccount, apiResponse) {
     *   if (!err) {
     *     const serviceAccountEmail = serviceAccount.emailAddress;
     *   }
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * storage.getServiceAccount().then(function(data) {
     *   const serviceAccountEmail = data[0].emailAddress;
     *   const apiResponse = data[1];
     * });
     */
    getServiceAccount(options, callback) {
        if (!callback) {
            callback = options;
            options = {};
        }
        this.request({
            uri: `/projects/${this.projectId}/serviceAccount`,
            qs: options,
        }, (err, resp) => {
            if (err) {
                callback(err, null, resp);
                return;
            }
            const camelCaseResponse = {};
            for (const prop in resp) {
                if (resp.hasOwnProperty(prop)) {
                    const camelCaseProp = prop.replace(/_(\w)/g, (_, match) => match.toUpperCase());
                    camelCaseResponse[camelCaseProp] = resp[prop];
                }
            }
            callback(null, camelCaseResponse, resp);
        });
    }
}
/**
 * {@link Bucket} class.
 *
 * @name Storage.Bucket
 * @see Bucket
 * @type {Constructor}
 */
Storage.Bucket = bucket_1.Bucket;
/**
 * {@link Channel} class.
 *
 * @name Storage.Channel
 * @see Channel
 * @type {Constructor}
 */
Storage.Channel = channel_1.Channel;
/**
 * {@link File} class.
 *
 * @name Storage.File
 * @see File
 * @type {Constructor}
 */
Storage.File = file_1.File;
/**
 * Cloud Storage uses access control lists (ACLs) to manage object and
 * bucket access. ACLs are the mechanism you use to share objects with other
 * users and allow other users to access your buckets and objects.
 *
 * This object provides constants to refer to the three permission levels that
 * can be granted to an entity:
 *
 *   - `gcs.acl.OWNER_ROLE` - ("OWNER")
 *   - `gcs.acl.READER_ROLE` - ("READER")
 *   - `gcs.acl.WRITER_ROLE` - ("WRITER")
 *
 * @see [About Access Control Lists]{@link https://cloud.google.com/storage/docs/access-control/lists}
 *
 * @name Storage.acl
 * @type {object}
 * @property {string} OWNER_ROLE
 * @property {string} READER_ROLE
 * @property {string} WRITER_ROLE
 *
 * @example
 * const {Storage} = require('@google-cloud/storage');
 * const storage = new Storage();
 * const albums = storage.bucket('albums');
 *
 * //-
 * // Make all of the files currently in a bucket publicly readable.
 * //-
 * const options = {
 *   entity: 'allUsers',
 *   role: storage.acl.READER_ROLE
 * };
 *
 * albums.acl.add(options, function(err, aclObject) {});
 *
 * //-
 * // Make any new objects added to a bucket publicly readable.
 * //-
 * albums.acl.default.add(options, function(err, aclObject) {});
 *
 * //-
 * // Grant a user ownership permissions to a bucket.
 * //-
 * albums.acl.add({
 *   entity: 'user-useremail@example.com',
 *   role: storage.acl.OWNER_ROLE
 * }, function(err, aclObject) {});
 *
 * //-
 * // If the callback is omitted, we'll return a Promise.
 * //-
 * albums.acl.add(options).then(function(data) {
 *   const aclObject = data[0];
 *   const apiResponse = data[1];
 * });
 */
Storage.acl = {
    OWNER_ROLE: 'OWNER',
    READER_ROLE: 'READER',
    WRITER_ROLE: 'WRITER',
};
exports.Storage = Storage;
/*! Developer Documentation
 *
 * These methods can be auto-paginated.
 */
paginator_1.paginator.extend(Storage, 'getBuckets');
/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisify_1.promisifyAll(Storage, {
    exclude: ['bucket', 'channel'],
});
//# sourceMappingURL=index.js.map