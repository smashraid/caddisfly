import { Client } from "cassandra-driver";

export const cassandraClient = new Client({
    contactPoints: ["127.0.0.1"],
    localDataCenter: "datacenter1",
    keyspace: "ledger"
});

export const connectCassandra = async () => {
    await cassandraClient.connect();
    console.log("Cassandra connected");
}