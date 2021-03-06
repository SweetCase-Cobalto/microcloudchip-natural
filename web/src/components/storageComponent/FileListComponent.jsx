import styled from "styled-components";
import { Button, Dropdown, Form, Modal, ProgressBar } from "react-bootstrap";
import FileItemInList from "./FileItemInList";
import CustomCheckbox from "../atomComponents/CustomCheckbox";
import { connect } from "react-redux";
import { useState } from "react";
import { updateDirList } from "../../reducers/DirListReducer";
import { updateDirs } from "../../reducers/SelectedDirReducer";
import CONFIG from '../../asset/config.json';
import axios from "axios";
import { ErrorCodes } from "../../modules/err/errorVariables";

const FileListComponent = (props) => {

    // Modal Events
    const [directoryAdderShow, setDirectoryAdderShow] = useState(false);
    const [fileUploaderShow, setFileUploaderShow] = useState(false);

    let allRootArr = decodeURI(window.location.pathname).split('/').slice(2); // url 파라미터로부터 가져온다
    
    // 공백 제거
    if(allRootArr[allRootArr.length - 1] == "") {
        allRootArr.pop();
    }
    
    let allRootArrToString = ""; // allRootArr를 화면에 출력하기 위해 String 변환
    let datas = []; // 파일리스트와 디렉토리 리스트를 저정하는 배열

    let selectedDirList = props.SelectedDirReducer.dirList; // 선택된 파일/디렉토리 리스트

    // 내 정보
    let userInfo = props.ConnectedUserReducer;

    // 체크박스 클릭 핸들러
    const checkBoxClickHandler = (f) => {

        // 각 파일의 체크박스 선택 시 사용되는 핸들러
        // 주로 선택된 파일 리스트를 redux를 사용해 관리하는데 사용한다.

        if(f["filename"] == ".." || f["filename"] == ".") {
            // 뒤로 가기 버튼 예외처리
            return;
        }

        // 파일/디렉토리 이름에 대한 인덱스 찾기
        // 없으면 targetIdx 값은 -1이고 있으면 0 이상이다.
        let __key = f["filename"]+"/"+String(f["type"]);
        let targetIdx = selectedDirList.indexOf(__key);

        /*
         * 없다는 것(-1)은 선택이 아직 안되어 있다는 의미이므로
         * 선택 설정을 하고
         * 반대로 선택된 데이터에 있는(0 이상) 경우는 선택 해제해야 한다.
        */
        if(targetIdx > -1) {
            // 이미 있는 경우 해제해야 하므로
            // 삭제
            if(targetIdx == 0) {
                // 맨 앞에 있는 걸 선택 해제해야 하는 경우
                selectedDirList = selectedDirList.slice(1);
            } else {
                // 중간 및 끝부분에 선택된 데이터를 해제해야 하는 경우
                let leftArr = selectedDirList.slice(0, targetIdx);
                let rightArr = selectedDirList.slice(targetIdx + 1);
                selectedDirList = leftArr.concat(rightArr);
            }
            // 선택 리스트 수정 후
            // 결과 반영을 위한 redux 업데이트
            props.updateDirs(selectedDirList);
        } else {
            // 없는 경우 ==  파일 및 디렉토리 추가
            // 선택된 파일 리스트에 추가
            selectedDirList = selectedDirList.concat(__key);
            props.updateDirs(selectedDirList);
        }
    }

    // 디렉토리 생성 이벤트
    const createDirectoryEvent = async (e) => {
        // 새로 올릴 디렉토리 이름
        let newDirectoryName = e.target.newDirectory.value;
        
        // 디렉토리명 검토
        if(newDirectoryName == "") {
            alert("생성할 디렉토리 이름을 입력하세요");
            e.preventDefault();
        }

        // 슬래시 있는 지 확인
        if(newDirectoryName.indexOf('/') != -1) {
            alert("디렉토리에 슬래시가 들어갈 수 없습니다.");
            return;
        } else {
            // 서버로부터 데이터를 받아요
            let token = userInfo.token; // User Token, 서버에 인증 요청을 할 때 사용한다.
            let staticId = userInfo.id; // User 고유 아이디이다.
            let targetRoot = allRootArr.join('/') + "/" + newDirectoryName; // 새로 생성 될 디렉토리 루트
            let URL = CONFIG.URL + "/server/storage/data/dir/" + staticId + "/" + targetRoot;
            // Server로 요청 할 URL --> [host]/server/storage/data/dir/[user id]/[target root]

            axios.post(URL, null, {
                headers: { "Set-Cookie": token },
                withCredentials: true,
                crossDomain: true
            }).then((r) => {
                let data = r.data;
                if(data.code != 0) {
                    // 요청 실패
                    if(data.code == ErrorCodes.ERR_FILE_AND_DIRECTORY_NAME_VALIDATE_ERR) {
                        // 디렉토리 작명 문제
                        alert("디렉토리의 이름이 올바르지 않습니다.");
                    } else if(data.code == ErrorCodes.ERR_DIR_ALEADY_EXISTS_ERR || data.code == ErrorCodes.ERR_FILE_ALEADY_EXISTS_ERR) {
                        // 동일 이름의 디렉토리 및 파일이 존재하는 경우
                        alert("같은 이름의 디렉토리나 파일이 이미 존재합니다.");
                    }
                    else {
                        // 기타 다른 문제
                        alert("디렉토리를 생성하는 데 문제가 발생했습니다.");
                    }
                }
                // 성공은 Return 값이 code 말곤 없으므로 할 필요 없음
            })
            // TODO: 예외처리 필요

        }
        
    }
    // 디렉토리 생성 이벤트 함수는 여기까지

    // Start
    if(props.DirListReducer.errCode === undefined) {
        // 아직 데이터를 갖고오지 못한 경우(렌더링 전)
        // 해당 디렉토리로부터 데이터를 서버로부터 갖고와서 업데이트
        props.updateDirList(allRootArr, userInfo.token, userInfo.id);

        // 로딩 페이지
        return(
            <Layout>
                <h1>Loading</h1>
            </Layout>
        );
    } else if (props.DirListReducer.errCode != 0) {
        // 세션 만료로 인해 id가 소멸된 경우 혹은 데이터 로딩에 실패한 경우
        if(userInfo.id === undefined || userInfo.id == "")
            props.hisotory.push("/");
        
        alert("해당 디렉토리는 존재하지 않습니다.");
        props.history.goBack(); // 뒤로가기
    } else {
        // 데이터 로딩에 성공

        // 파일 리스트와 디렉토리 리스트를 전부 data에 저장
        // 디렉토리 -> 파일 순으로 저장한다.
        datas = props.DirListReducer.directoryList.concat(props.DirListReducer.fileList);

        // List로 정의되어있는 루트를 문자열로 변환
        allRootArrToString = allRootArr.join('/');

        const FileItemsComponent = datas.map((f, index) => {
            // 파일/디렉토리 레코드(아이템) 컴포넌트

            let __color = ( (f['filename'] == '.' || f['filename'] == '..') ? '#FFFFFF': "#137813" )
            // 뒤로가기는 아예 하얀색으로 칠해서 선택 못하기 막아야 한다. (Component Event도 막게 설정되어 있다 --> checkBoxClickHandler)

            // Make File List Component
            return (
                <div key={index} style={{ display: "flex", marginBottom: "20px" }}>
                    <CustomCheckbox color={__color}
                            onClick={() => { checkBoxClickHandler(f); }} />
                    <FileItemInList 
                            isDir={f['isDir']}
                            filename={f['filename']}
                            fileType={f['type']} 
                            history={props.history} />
                </div>
            );

        });

        /* 여기부터는 Modal Compoent */
        const DirectoryUploadModal = () => {
            // 모달 컴포넌트: 디렉토리 업로드

            const closeEvent = () => setDirectoryAdderShow(false);
            // 모달 닫기 이벤트

            return (
                <Modal
                    show={directoryAdderShow}
                    onHide={closeEvent}
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>디렉토리 생성</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={createDirectoryEvent}>
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="newDirectoryName">
                                <Form.Label>생성할 디렉토리 이름을 입력하세요</Form.Label>
                                <Form.Control type="text" placeholder="디렉토리 이름 입력" name="newDirectory" />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button type="submit" variant="success">생성</Button>
                            <Button variant="secondary" onClick={closeEvent}>취소</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            );
        }
        const FileUploadModal = () => {
            // 모달 컴포넌트: 파일 업로드 모달

            const closeEvent = () => setFileUploaderShow(false);

            const [uploadProcess, setUploadProcess] = useState({
                "targetFilesLength": -1,
                "uploadedFilesLength": -1,
                "progressFileName": undefined,
            });
            /*
                targetFilesLength: targetFiles의 길이
                
                uploadedFilesLength: 업로드 완료된 파일의 갯수
                    -1 => 시작 전
                    0 ~ ... => 업로드가 완료된 파일 갯수
                    선택된 파일 갯수와 일치 => 완료

                progressFileName: 업로드 진행 중인 파일의 이름
            */

            const uploadHandler = async (e) => {
                // 업로드 진행 이벤트 핸들러
                
                e.preventDefault();
                let targetFiles = e.target.newUploadedFileList.files; // 업로드 대상 파일 및 파일 갯수 저장
                let targetFilesLength = targetFiles.length; // 파일 업로드 진행바 생성을 위해 선택된 파일 갯수 갱신
                
                // 데이터 저장
                setUploadProcess({
                    "targetFilesLength": targetFilesLength,
                    "uploadedFilesLength": -1,
                    "progressFileName": undefined,
                });
                
                // 파일이 없는 경우
                if(targetFilesLength < 1) {
                    alert("파일을 선택해 주세요");
                    return;
                }

                // URL 생성
                let URL = `${CONFIG.URL}/server/storage/data/file/${props.ConnectedUserReducer.id}/${props.DirListReducer.curUrl.join('/')}`;

                // 업로드 시작
                setUploadProcess({
                    "targetFilesLength": targetFilesLength,
                    "uploadedFilesLength": 0,
                    "progressFileName": targetFiles[0].name
                });

                // 파일 순차적으로 업로드
                // filelist는 object가 아니기 때문에 For를 사용해야 한다
                for(let i = 0; i < targetFilesLength; i++) {

                    // 업로드 할 파일 정보
                    let file = targetFiles[i];
                    
                    //  URL 생성
                    let FILE_URL = `${URL}/${file.name}`;
                    
                    // 파일 업로드를 위한 FormData 생성
                    let formData = new FormData();
                    formData.append('file', file);


                    // 전송 시작
                    let result = await axios.post(FILE_URL, formData, {
                        headers: { 'Set-Cookie': props.ConnectedUserReducer.token},
                        withCredentials: true,
                        crossDomain: true
                    }).then((response) => response.data)
                    .catch((err) => {
                        // 전송 실패
                        return {
                            "code": ErrorCodes.ERR_AXIOS_FAILED,
                            "err": err
                        }
                    })

                    // 전송 결과
                    if(result.code == ErrorCodes.ERR_AXIOS_FAILED) {
                        // Axios Error: 주로 서버와 연결이 끊어졌을 때 발생한다.
                        alert("서버로부터 연결이 끊어졌습니다.");
                        break;
                    } else if(result.code == ErrorCodes.ERR_FILE_ALEADY_EXISTS_ERR 
                        || result.code == ErrorCodes.ERR_DIR_ALEADY_EXISTS_ERR
                        || result.code == 0) {
                        
                        // 업로드에 성공했거나
                        // 실패해도 넘어가도 되는 경우
                            // 증복 파일 및 디렉토리 발견

                        if(result.code == ErrorCodes.ERR_FILE_ALEADY_EXISTS_ERR) {
                            alert(`같은 파일 이름이 존재합니다. 무시하고 다음 파일을 업로드 합니다. 파일 명: ${file.name}`);
                            // TODO: 파일 같은 부분은 차후에 덮어쓰기 선택지로 변경 예정
                        } else if(result.code == ErrorCodes.ERR_DIR_ALEADY_EXISTS_ERR) {
                            // 같은 이름의 디렉토리 발견
                            alert(`같은 디렉토리 이름이 존재합니다. 무시하고 다음 파일을 업로드 합니다. 디렉토리 명: ${file.name}`)
                        }

                        // 계속 진행
                        let nextFileName = "";
                        if(i == targetFilesLength - 1)
                            nextFileName = "업로드 완료"
                        else
                            nextFileName = targetFiles[i + 1].name;

                        // 파일 하나를 업로드 완료 했으므로 상태 데이터를 갱신한다.
                        // 완료 갯수(혹은 인덱스)와 다음 파일 이름을 수정함으로써
                        // 갱신한다.
                        setUploadProcess({
                            "targetFilesLength": targetFilesLength,
                            "uploadedFilesLength": i + 1,
                            "progressFileName": nextFileName,
                        });
                        
                    } else if(result.code == ErrorCodes.ERR_STORAGE_OVER_CAPACITY_ERR) {
                        // 용랑 초과
                        alert("저장 용량 초과로 인해 더 이상 파일을 업로드 할 수 업습니다.");
                        window.location.reload();
                    } else {
                        // 서버상의 에러
                        alert(result.code);
                        alert("파일에 문제가 있습니다. 다시 업로드해 주세요");
                        window.location.reload();
                    }
                    
                }
            }

            const ModalBodyComponent = () => {
                // 모달 내용 컴포넌트
                // 업로드 진행 상태에 따라 내용도 달라져야 한다
                
                if(uploadProcess.uploadedFilesLength == -1) {
                    // 업로드 시작 전
                    return (
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="newUploadedFileName">
                                <Form.Label>업로드 할 파일을 선택해 주세요</Form.Label>
                                <Form.Control type="file" name="newUploadedFileList" multiple />
                            </Form.Group>
                        </Modal.Body>
                    );
                } else {
                    // 업로드 진행
                    let percentage = (uploadProcess.uploadedFilesLength / uploadProcess.targetFilesLength) * 100;
                    // 진행 상황 Percentage
                    return (
                        <Modal.Body>
                            <h5>Upload: {uploadProcess.progressFileName}</h5>
                            <ProgressBar striped variant="success" now={percentage} />
                        </Modal.Body>
                    );
                }
            }
            const ModalFooterComponent = () => {
                // 모달 선택지 부분 컴포넌트

                // 업로드 진행 상태에 따라 버튼 이벤트도 달라진단다
                if(uploadProcess.uploadedFilesLength == -1) {
                    // 업로드 전
                    return (
                        <Modal.Footer>
                            <Button variant="success" type="submit">업로드</Button>
                            <Button variant="secondary" onClick={closeEvent}>취소</Button>
                        </Modal.Footer>
                    );
                } else if (uploadProcess.progressFileName !== undefined && 
                    uploadProcess.uploadedFilesLength < uploadProcess.targetFilesLength) {
                    // 진행중
                    return (
                        <Modal.Footer />
                    );
                } else {
                    // 업로드 완료
                    return (
                        <Modal.Footer>
                            <Button variant="success" onClick={() => {
                                window.location.reload();
                            }}>확인</Button>
                        </Modal.Footer>
                    );
                }
            }
            
            // 전체 모달
            return (
                <Modal
                    show={fileUploaderShow}
                    onHide={() => {
                        if(uploadProcess.uploadedFilesLength == uploadProcess.targetFilesLength &&
                            uploadProcess.progressFileName !== undefined) {
                                // 업로드 완료 시 새로고침
                                window.location.reload();
                        } else {
                            closeEvent();
                        }
                    
                    }}
                    centered
                >
                <Modal.Header closeButton>
                    <Modal.Title>파일 업로드</Modal.Title>
                </Modal.Header>
                <Form onSubmit={uploadHandler}>
                    <ModalBodyComponent />
                    <ModalFooterComponent />
                </Form>
            </Modal>
            );
        }


        // 전체 컴포넌트
        return (
            <Layout>
                <h4 style={{ fontWeight: "bold" }}>{allRootArrToString}</h4>
                
                <div style={{ marginTop: "20px", display: "flex" }}>

                    <Dropdown>
                        <Dropdown.Toggle variant="success" id="item-adder" style={{ paddingLeft: "30px", paddingRight: "30px", marginRight: "10px" }}>
                            업로드
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setFileUploaderShow(true)}>파일 업로드</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown>
                        <Dropdown.Toggle variant="outline-success" id="item-adder">
                            생성
                        </Dropdown.Toggle>
    
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setDirectoryAdderShow(true)}>디렉토리 생성</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                </div>
    
                <div style={{ backgroundColor: "gray", width: "100%", height:"1.4px", marginTop: "20px", marginBottom: "20px" }} />
                <ListLayout>
                    {FileItemsComponent}
                </ListLayout>

                <DirectoryUploadModal />
                <FileUploadModal />
            </Layout>
        );
    }
}
const mapStateToProps = (state) => {
    return {
        "DirListReducer": state.DirListReducer,
        "SelectedDirReducer": state.SelectedDirReducer,
        "ConnectedUserReducer": state.ConnectedUserReducer
    }
}

export default connect(mapStateToProps, {
    updateDirList, updateDirs
})(FileListComponent);

const Layout = styled.div`
    line-height: 0.4em;

    font-family: "Gothic A1";
    width: 65%;
    height: 100vh;

    border: 1.2px solid #1DB21D;
    box-shadow: 2px 2px 3px gray;

    padding: 30px;
`;
const ListLayout = styled.div`

    overflow: scroll;
    height: 70%;
    
    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;

        border-radius: 6px;
        background: rgba(255 255, 255, 0.4);
    }
    &::-webkit-scrollbar-thumb {
        background-color: rgba(19, 120, 19, 0.4);
        border-radius: 6px;
    }
    
`