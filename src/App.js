import React, {useState} from 'react';
import { Button, Icon, Layout, Row, Col , Input, Card, Select } from 'antd'

import SDK from 'apis/SDK';
import IconexConnect from 'apis/IconexConnect';
import CONST from './constants';
import {
  IconConverter
} from 'icon-sdk-js'

import './App.css';

const { Header , Content } = Layout;
const { Option } = Select;
function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

function stringFromUTF8Array(data) {
  const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
  var count = data.length;
  var str = "";

  for (var index = 0; index < count;) {
    var ch = data[index++];
    if (ch & 0x80) {
      var extra = extraByteMap[(ch >> 3) & 0x07];
      if (!(ch & 0x40) || !extra || ((index + extra) > count))
        return null;

      ch = ch & (0x3F >> extra);
      for (; extra > 0; extra -= 1) {
        var chx = data[index++];
        if ((chx & 0xC0) != 0x80)
          return null;

        ch = (ch << 6) | (chx & 0x3F);
      }
    }

    str += String.fromCharCode(ch);
  }

  return str;
}

function convertList(myData) {
  var converted = [];
  for (var j = 0; j < myData.length; j += 1) {
    converted.push(stringFromUTF8Array(hexToBytes(myData[j])))
  }
  return converted
}


function App() {
  const [ mode, setMode ] = useState( CONST.MODE['LOG_OUT'])
  const [ memoInput, setMemoInput ] = useState('')
  const [ memoList, setmemoList ] = useState([])
  const [ myAddress, setMyAddress ] = useState('')
  const [ myData, setMyData ] = useState({ label: '', BDay: '' })
  const [ inputData, setInputData ] =  useState({ label: '00', BDay: '0' })
  const [ curBlockHeight, setCurClockHeight ] = useState(0)
  const [ vote1, setVote1 ] = useState(0)

  
  const [selectedMember, setSelectedMember] = useState(1)

  async function getAddress  ()  { 
    const { iconService, callBuild } = SDK
    const myAddress = await IconexConnect.getAddress()
    console.log(myAddress)
    const myData = await iconService.call(
      callBuild({
        from: myAddress,
        methodName: 'get',
        params: {},
        to: window.CONTRACT_ADDRESS,
      })
    ).execute()

    setmemoList(convertList(myData))
    setMode(CONST.MODE['LOG_IN'])
    setMyAddress(myAddress)
  }

  async function addMemo() {
    if (myAddress === '') {
      alert("이 서비스를 이용하려면 지갑 로그인이 필요합니다.")
      return
    }
    if(memoInput.trim().length > 0) {
      setmemoList([memoInput, ...memoList ])
      setMemoInput('')
      const txObj = SDK.sendTxBuild({
        from: myAddress,
        to: window.CONTRACT_ADDRESS,
        methodName: 'set',
        params: {
          _hack: IconConverter.fromUtf8(memoInput),
        },
      })
      const tx = await IconexConnect.sendTransaction(txObj)

      if (tx) {
        alert("체크리스트가 성공적으로 등록되었습니다.")
      }
    }
  }

  return (
    <Layout>
      <Header>
        <Button size="large" onClick={getAddress} type="primary">ICONex 연동하기</Button>
      </Header>
      <Content>
        <Row type="flex" justify="center" align="middle" className={`page-wrap`}>
          <Col style={{width: '80%', maxWidth: 700 }}>
            <Icon type="check" style={{color: 'red', fontSize: 40}}/>
            <h1>체크리스트</h1>
            <div className="form-wrap">
              <Input size="large" style={{width: 250}} value={memoInput} onChange={(e)=>setMemoInput(e.target.value)}/>
              <Button type="primary" size="large" onClick={addMemo}>추가하기</Button>
            </div>
            <div style={{marginTop:20, backgroundColor: 'rgb(17,134,150)', color: 'white', padding: 10, fontSize: 16}}> CHECK LIST </div>
            <div >
              {memoList.map((item) => (
                <div className="list"><Icon type="check" style={{color: 'red', marginRight: 5}}/>{item}</div>
              ))
              }
            </div>
          </Col>
        </Row>
    </Content>
    </Layout>
  );
}

export default App;
