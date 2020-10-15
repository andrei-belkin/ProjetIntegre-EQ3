package com.power222.tuimspfcauppbj.service;

import com.power222.tuimspfcauppbj.dao.InternshipOfferRepository;
import com.power222.tuimspfcauppbj.dao.ResumeRepository;
import com.power222.tuimspfcauppbj.dao.StudentApplicationRepository;
import com.power222.tuimspfcauppbj.dao.StudentRepository;
import com.power222.tuimspfcauppbj.model.Student;
import com.power222.tuimspfcauppbj.model.StudentApplication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentApplicationService {

    private final StudentApplicationRepository appliRepo;
    private final InternshipOfferRepository offerRepo;
    private final ResumeRepository resumeRepo;
    private final AuthenticationService authSvc;

    public StudentApplicationService(StudentApplicationRepository appliRepo, InternshipOfferRepository offerRepo, StudentRepository studentRepo, ResumeRepository resumeRepo, AuthenticationService authSvc) {
        this.appliRepo = appliRepo;
        this.offerRepo = offerRepo;
        this.resumeRepo = resumeRepo;
        this.authSvc = authSvc;
    }

    public List<StudentApplication> getAllApplication() {
        return appliRepo.findAll();
    }

    public Optional<StudentApplication> createAndSaveNewApplication(long offerId, long resumeId) {
        var currentUser = authSvc.getCurrentUser();
        var offer = offerRepo.findById(offerId);
        var resume = resumeRepo.findById(resumeId);
        if (currentUser instanceof Student && offer.isPresent() && resume.isPresent()) {
            return Optional.of(appliRepo.saveAndFlush(StudentApplication.builder()
                    .student((Student) currentUser)
                    .offer(offer.get())
                    .resume(resume.get())
                    .isHired(false)
                    .hasStudentAccepted(false)
                    .reasonForRejection("")
                    .build()));
        } else
            return Optional.empty();
    }

    public Optional<StudentApplication> updateStudentApplicationHasStudentAccepted(long idStudentApplication) {
        return appliRepo.findById(idStudentApplication)
                .map(oldAppli -> {
                    oldAppli.setHasStudentAccepted(true);
                    return appliRepo.saveAndFlush(oldAppli);
                });
    }

    public StudentApplication updateStudentApplication(long id, StudentApplication application) {
        return appliRepo.findById(id)
                .map(oldApplication -> {
                    application.setId(oldApplication.getId());
                    return appliRepo.saveAndFlush(application);
                })
                .orElse(application);
    }
}
