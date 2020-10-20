import Container from '@material-ui/core/Container';
import Grid from "@material-ui/core/Grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import {ErrorMessage, Field, Form, Formik} from "formik";
import {TextField} from "formik-material-ui";
import React, {useEffect, useState} from "react";
import {useHistory, useLocation} from 'react-router-dom';
import * as yup from "yup";
import {DateTimePicker} from 'formik-material-ui-pickers';
import {useApi} from "../Utils/Hooks";
import Button from "@material-ui/core/Button";
import {useStyles} from "../Utils/useStyles";
import AuthenticationService from '../../Services/AuthenticationService';

const tooShortError = (value) => "Doit avoir au moins " + value.min + " caractères";
const tooLittleError = (valueNumber) => "Doit être un nombre plus grand que ou égal à " + valueNumber.min;
const requiredFieldMsg = "Ce champs est requis";

export default function InterviewConvocation() {
    const classes = useStyles();
    const api = useApi();
    const location = useLocation();
    const history = useHistory();
    const [applicationInterview, setApplicationInterview] = useState()
    const [applications, setApplications] = useState([{}]);

    useEffect(() => {
        console.log("dddd" + JSON.stringify(location.state))
        setApplicationInterview(location.state)
        api.get("/applications").then((r) => setApplications(r.data))
    }, [])

    const validationSchema = yup.object().shape({
        studentFirstName: yup.string().trim().min(2, tooShortError).required(requiredFieldMsg),
        studentLastName: yup.string().trim().min(2, tooShortError).required(requiredFieldMsg),
        interviewDate: yup.date().required(),
        email: yup.string().trim().email("L'email n'a pas un format valide").required(requiredFieldMsg),
    });
    const initialValues = {
        studentFirstName: '',
        studentLastName: '',
        interviewDate: new Date(),
        email: ''
    }

    function createInterview(values) {
        // applications.filter(elem => elem.student.firstName == values.studentName)[0]
        let dto = {...values};
        dto.date = values.interviewDate
        dto.employer = AuthenticationService.getCurrentUser()
        dto.reviewState = "PENDING"
        dto.studentApplication = applicationInterview
        //dto.studentApplication = applications.filter(elem => elem.student.firstName == values.studentFirstName
        //)[0];
        api.post("/interviews", dto)
    }

    return (

        <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justify="center"
            style={{minHeight: '100vh'}}
        >
            <Grid item xs={12} sm={7} lg={5}>
                <Container component="main" maxWidth="sm" className={classes.container}>
                    <Formik
                        onSubmit={async (values) => {
                            console.log("rrrr" + JSON.stringify(applicationInterview))
                            createInterview(values)
                            history.push("/dashboard/listInterview")
                        }
                        }

                        validateOnBlur={false}
                        validateOnChange={false}
                        enableReinitialize={true}
                        validationSchema={validationSchema}
                        initialValues={initialValues}
                        validate={(values) => {
                            const errors = {};
                        }}
                    >
                        {({isSubmitting, setFieldValue}) => (
                            <Form className={classes.form}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Field
                                            component={TextField}
                                            name="studentFirstName"
                                            id="studentFirstName"
                                            variant="outlined"
                                            label="Nom de l'étudiant"
                                            required
                                            fullWidth
                                            autoFocus
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field
                                            component={TextField}
                                            name="studentLastName"
                                            id="studentLastName"
                                            variant="outlined"
                                            label="Prenom de l'étudiant"
                                            required
                                            fullWidth
                                            autoFocus
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Field
                                            component={DateTimePicker}
                                            name="interviewDate"
                                            variant="outlined"
                                            label="Date et heure de l'entrevue "
                                            required
                                            fullWidth
                                            format="MM/dd/yyyy"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Field
                                            component={TextField}
                                            name="email"
                                            id="email"
                                            variant="outlined"
                                            label="Addresse courriel"
                                            type={"email"}
                                            required
                                            fullWidth
                                        />
                                    </Grid>
                                    <ErrorMessage name={"file"}>
                                        {msg => <p id="msgError"><span style={{color: "red"}}>{msg}</span>
                                        </p>}
                                    </ErrorMessage>
                                </Grid>
                                <br/>
                                {isSubmitting && <LinearProgress/>}
                                <Button
                                    type={"submit"}
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size={"large"}
                                    className={classes.submit}
                                    disabled={isSubmitting}
                                >
                                    Convoquer l'étudiant
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </Container>
            </Grid>
        </Grid>
    )
}
