import styled from "styled-components";
import {Image, Form, Button} from "react-bootstrap";

const AccountUpdaterForm = (props) => {

    // Component Title
    let idDisabled = false;
    let actionType = props.actionType;

    let btnTitle = "수정"

    let target = props.target
    switch(target) {
        case "admin":
            idDisabled = true;
        case "client":
            if(actionType == "add") {
                btnTitle = "추가"
            }
        default:
            break
    }

    return (
        <EditLayer>
            <Image src="holder.js/171x180" width="170px" height="170px" style={{ backgroundColor: "gray" }} roundedCircle />

            <EditForm>
                <Form.Group style={{ marginBottom: "20px" }} >
                    <Form.Label>아이디</Form.Label>
                    <Form.Control type="text" name="id" placeholder="6자 이상 12자 이하 영어만" disabled={idDisabled} />
                </Form.Group>

                <div style={{ display: "flex", marginBottom: "20px" }}>
                
                    <Form.Group style={{ marginRight: "5%", width: "50%" }} >
                        <Form.Label>비밀번호</Form.Label>
                        <Form.Control type="password" name="pswd" placeholder="8자 이상 24자 이하" />
                    </Form.Group>

                    <Form.Group style={{  width: "50%" }} >
                        <Form.Label>비밀번호 재입력</Form.Label>
                        <Form.Control type="password" name="pswdRepeat" placeholder="다시 한번 더" />
                    </Form.Group>
                </div>

                <Form.Group style={{ marginBottom: "30px" }} >
                    <Form.Label>이메일</Form.Label>
                    <Form.Control type="email" name="email" placeholder="example@example.com" disabled />
                </Form.Group>
            
                <div style={{ display: "flex", float: "right" }} >
                    <Button variant="success" style={{ width: "100px", marginRight: "20px", backgroundColor: "#137813"}} >{btnTitle}</Button>
                    <Button variant="secondary" style={{ width: "100px", backgroundColor: "#4C4D4C" }} >취소</Button>
                </div>
            </EditForm>
        </EditLayer>
    );

}

const EditLayer = styled.div`
    margin-top: 40px;
    display: flex;
`
const EditForm = styled.form`
    padding-left: 40px;
    width: 100%;
`
export default AccountUpdaterForm;