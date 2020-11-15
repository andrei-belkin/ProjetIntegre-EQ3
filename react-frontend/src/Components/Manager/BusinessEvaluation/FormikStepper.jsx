import {Button, CircularProgress, Grid, Step, StepLabel, Stepper} from '@material-ui/core';
import {Form, Formik} from 'formik';
import React, {useState} from 'react';
import {useHistory} from "react-router-dom";
import {useApi, useFileReader, useModal} from "../../Utils/Hooks";
import BusinessEvaluationModal from "./BusinessEvaluationModal";
import AuthenticationService from "../../../Services/AuthenticationService";

export function FormikStepper({application, initialValues, children}) {
    const history = useHistory()
    const api = useApi()
    const childrenArray = React.Children.toArray(children)
    const readFile = useFileReader()
    const [step, setStep] = useState(0)
    const currentChild = childrenArray[step]
    const [completed, setCompleted] = useState(false)
    const [data, setData] = useState({})
    const [validationButtonClick, setValidationButtonClick] = useState(false)
    const [isBusinessEvaluationModalOpen, openBusinessEvaluationModal, closeBusinessEvaluationModal] = useModal();

    function isLastStep() {
        return step === childrenArray.length - 1;
    }

    function pageRedirection() {
        if (AuthenticationService.getCurrentUserRole() === "admin")
            return "/dashboard/businessEvaluationList";
        else
            return "/dashboard/evaluationList";
    }

    function openModal() {
        if (AuthenticationService.getCurrentUserRole() === "admin")
            return <BusinessEvaluationModal isOpen={isBusinessEvaluationModalOpen} data={data}
                                            hide={closeBusinessEvaluationModal}/>
        else
            return <EvaluationModal isOpen={isEvaluationModalOpen} data={data} hide={closeEvaluationModal}/>
    }

    return <>
        {validationButtonClick ?
            openModal() : ""}
        <Formik
            initialValues={initialValues}
            validationSchema={currentChild.props.validationSchema}
            validateOnBlur={false}
            validateOnChange={false}
            validate={values => {
                if (!isLastStep())
                    return {};
                const errors = {};
                if (values.signature.image.type !== "image/png" && values.signature.image.type !== "image/jpeg") {
                    errors.signature = {};
                    errors.signature.image = "Le fichier doit être de type PNG ou JPEG"
                }
                return errors;
            }}
            onSubmit={async values => {
                if (isLastStep()) {
                    const dto = {...values};
                    dto.contract = application.contract;
                    dto.signature.image = await readFile(values.signature.image);
                    api.post("/businessEvaluation", dto)
                        .then(() => history.push(pageRedirection()));
                    setCompleted(true);
                } else {
                    setStep(s => s + 1);
                }
            }}
        >
            {({isSubmitting, values}) =>
                <Form autoComplete="off">
                    <Stepper alternativeLabel activeStep={step}>
                        {childrenArray.map((child, index) =>
                            <Step key={child.props.label} completed={step > index || completed}>
                                <StepLabel>{child.props.label}</StepLabel>
                            </Step>
                        )}
                    </Stepper>
                    {currentChild}
                    <Grid container spacing={2}>
                        {step > 0 &&
                        <Grid item>
                            <Button
                                disabled={isSubmitting}
                                variant="contained"
                                color="primary"
                                onClick={() => setStep(s => s - 1)}
                            >
                                PAGE PRÉCÉDENTE
                            </Button>
                        </Grid>
                        }

                        {isLastStep() &&
                        <Grid item>
                            <Button
                                disabled={isSubmitting}
                                variant="contained"
                                color="primary"
                                onClick={async () => {
                                    const dto = {...values}
                                    dto.application = application;
                                    setData(dto);
                                    setValidationButtonClick(true)
                                    openBusinessEvaluationModal();
                                }}
                            >
                                Valider évaluation
                            </Button>
                        </Grid>
                        }
                        <Grid item>
                            <Button
                                startIcon={isSubmitting ? <CircularProgress size="1rem"/> : null}
                                disabled={isSubmitting}
                                variant="contained"
                                color="primary"
                                type="submit"
                            >
                                {isSubmitting ? 'Submitting' : isLastStep() ? 'TERMINER' : 'PAGE SUIVANTE'}
                            </Button>
                        </Grid>
                    </Grid>
                </Form>
            }
        </Formik>
    </>
}