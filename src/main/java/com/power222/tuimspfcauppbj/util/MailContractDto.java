package com.power222.tuimspfcauppbj.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MailContractDto {
    private long studentApplicationId;
    private String file;
}
