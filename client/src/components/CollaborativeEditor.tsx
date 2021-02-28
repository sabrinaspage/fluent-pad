import _, { update } from 'lodash';
import { useEffect, useState } from 'react';
import { PeerIdB58, subscribeToEvent } from '@fluencelabs/fluence';

import { fluentPadServiceId, notifyTextUpdateFnName } from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import { getUpdatedDocFromText, initDoc, SyncClient } from '../app/sync';
import * as api from 'src/app/api';

export interface DataItem {
    enabled: boolean;
    text: string;
    type: string;
}

const DEFAULT_DATA_ITEM:DataItem = {
    enabled: true,
    text: "",
    type: "doc"
}

const broadcastUpdates = _.debounce((text: string, syncClient: SyncClient) => {
    let doc = syncClient.getDoc();
    if (doc) {
        let newDoc = getUpdatedDocFromText(doc, text);
        syncClient.syncDoc(newDoc);
    }
}, 100);

export const CollaborativeEditor = () => {
    const client = useFluenceClient()!;
    const [list, setList] = useState<DataItem[] | null>(null);
    const [text, setText] = useState<string | null>(null);
    const [syncClient, setSyncClient] = useState(new SyncClient());

    function updateListIndex(newItem: string | null, index: number) {
        let newList;
        if (list === null)
            newList = null
        else 
            newList = [...list];
        
        newList[index].text = newItem;

        return updateList(newList)
    }

    function appendToList(newItemType:string) {
        let newList;
        if (list === null)
            return null
        else 
            newList = [...list];
        
        newList.push({...DEFAULT_DATA_ITEM, type: newItemType})

        return updateList(newList)
    }

    function updateList(newList: DataItem[]) {
        setList( newList );
        const newText = JSON.stringify(newList);
        setText( newText );
        return newText;
    }

    function parseToList(newText: string):void {
        if (!newText)
            newText = JSON.stringify([DEFAULT_DATA_ITEM]);

        setText( newText );
        console.log( newText )
        const newList = JSON.parse(newText) 
        setList( newList );
    }

    useEffect(() => {
        syncClient.handleDocUpdate = (doc) => {
            parseToList(doc.text.toString());
        };

        syncClient.handleSendChanges = (changes: string) => {
            api.addEntry(client, changes);
        };

        const unsub = subscribeToEvent(client, fluentPadServiceId, notifyTextUpdateFnName, (args, tetraplets) => {
            const [authorPeerId, changes, isAuthorized] = args as [PeerIdB58, string, boolean];
            if (authorPeerId === client.selfPeerId) {
                return;
            }

            if (changes) {
                syncClient.receiveChanges(changes);
            }
        });

        syncClient.start();

        // don't block
        api.getHistory(client).then((res) => {
            for (let e of res) {
                syncClient.receiveChanges(e.body);
            }

            if (syncClient.getDoc() === undefined) {
                syncClient.syncDoc(initDoc());
            }
        });

        return () => {
            unsub();
            syncClient.stop();
        };
    }, []);

    const handleTextUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const itemText = e.target.value;
        const newText = updateListIndex(itemText, index);
        broadcastUpdates(newText, syncClient);
    };

    return (
        <div>
            {list ? list.map((item, index) => {
                switch(item.type) {
                    case "doc": 
                    default:
                        return <textarea
                            spellCheck={false}
                            className="code-editor"
                            disabled={item.text === null}
                            value={item.text ?? ''}
                            onChange={(e) => handleTextUpdate(e, index)}
                        />
                }
            }) : <p> Loading data... </p>}
        
        <button onClick={()=>appendToList("doc")}>Add Item</button>
        
        </div>
        
    );
};
